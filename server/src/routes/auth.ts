import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../lib/jwt.js'
import { buildTabelasParaNovoEscritorio } from '../data/tabelasSeed.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { isEmailSuperAdmin } from '../middleware/superAdmin.js'

export const authRouter = Router()

function escritorioPublico(e: {
  id: string
  nomeEscritorio: string
  nomeAdvogadoResponsavel: string
  oabNumero: string
  oabUf: string
  cpfCnpj: string
  endereco: string
  banco?: string | null
  agencia?: string | null
  conta?: string | null
  pix?: string | null
  ativo: boolean
  planoStatus: string
  trialAte: Date | null
  dataProximoVencimento: Date | null
}) {
  return {
    id: e.id,
    nomeEscritorio: e.nomeEscritorio,
    nomeAdvogadoResponsavel: e.nomeAdvogadoResponsavel,
    oabNumero: e.oabNumero,
    oabUf: e.oabUf,
    cpfCnpj: e.cpfCnpj,
    endereco: e.endereco,
    banco: e.banco ?? undefined,
    agencia: e.agencia ?? undefined,
    conta: e.conta ?? undefined,
    pix: e.pix ?? undefined,
    ativo: e.ativo,
    planoStatus: e.planoStatus,
    trialAte: e.trialAte ?? undefined,
    dataProximoVencimento: e.dataProximoVencimento ?? undefined,
  }
}

function usuarioPublico(u: { id: string; nome: string; email: string; role: string }) {
  return { id: u.id, nome: u.nome, email: u.email, role: u.role, superAdmin: isEmailSuperAdmin(u.email) }
}

authRouter.post('/register', async (req, res) => {
  const {
    nomeEscritorio,
    nomeAdvogadoResponsavel,
    oabNumero,
    oabUf,
    cpfCnpj,
    endereco,
    nomeUsuario,
    email,
    senha,
  } = req.body ?? {}

  if (!nomeEscritorio || !nomeUsuario || !email || !senha) {
    return res.status(400).json({ error: 'Nome do escritório, nome do usuário, e-mail e senha são obrigatórios.' })
  }
  if (String(senha).length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  const existente = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (existente) {
    return res.status(409).json({ error: 'Já existe uma conta cadastrada com este e-mail.' })
  }

  const senhaHash = await bcrypt.hash(String(senha), 10)

  const escritorio = await prisma.escritorio.create({
    data: {
      nomeEscritorio,
      nomeAdvogadoResponsavel: nomeAdvogadoResponsavel || nomeUsuario,
      oabNumero: oabNumero || '',
      oabUf: oabUf || 'SP',
      cpfCnpj: cpfCnpj || '',
      endereco: endereco || '',
      users: {
        create: {
          nome: nomeUsuario,
          email: String(email).toLowerCase(),
          senhaHash,
          role: 'admin',
        },
      },
    },
    include: { users: true },
  })

  const tabelas = buildTabelasParaNovoEscritorio()
  await prisma.tabelaOAB.createMany({
    data: tabelas.map((t) => ({
      escritorioId: escritorio.id,
      uf: t.uf,
      nomeSeccional: t.nomeSeccional,
      vigencia: t.vigencia,
      fonteUrl: t.fonteUrl,
      statusDados: t.statusDados,
      itensJson: JSON.stringify(t.itens),
    })),
  })

  const user = escritorio.users[0]
  const token = signToken({ userId: user.id, escritorioId: escritorio.id })

  return res.status(201).json({
    token,
    user: usuarioPublico(user),
    escritorio: escritorioPublico(escritorio),
  })
})

authRouter.post('/login', async (req, res) => {
  const { email, senha } = req.body ?? {}
  if (!email || !senha) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' })
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
    include: { escritorio: true },
  })
  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' })
  }
  const ok = await bcrypt.compare(String(senha), user.senhaHash)
  if (!ok) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' })
  }

  const token = signToken({ userId: user.id, escritorioId: user.escritorioId })
  return res.json({
    token,
    user: usuarioPublico(user),
    escritorio: escritorioPublico(user.escritorio),
  })
})

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    include: { escritorio: true },
  })
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })
  return res.json({
    user: usuarioPublico(user),
    escritorio: escritorioPublico(user.escritorio),
  })
})
