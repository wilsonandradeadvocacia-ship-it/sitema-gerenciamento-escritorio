import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { requireAssinaturaAtiva } from '../middleware/assinatura.js'

export const clientesRouter = Router()
clientesRouter.use(requireAuth, requireAssinaturaAtiva)

clientesRouter.get('/', async (req: AuthedRequest, res) => {
  const clientes = await prisma.cliente.findMany({
    where: { escritorioId: req.auth!.escritorioId },
    orderBy: { criadoEm: 'desc' },
  })
  res.json(clientes)
})

clientesRouter.post('/', async (req: AuthedRequest, res) => {
  const b = req.body ?? {}
  if (!b.nome || !b.cpfCnpj) {
    return res.status(400).json({ error: 'Nome e CPF/CNPJ são obrigatórios.' })
  }
  const cliente = await prisma.cliente.create({
    data: {
      escritorioId: req.auth!.escritorioId,
      nome: b.nome,
      tipo: b.tipo || 'fisica',
      cpfCnpj: b.cpfCnpj,
      email: b.email || '',
      telefone: b.telefone || '',
      endereco: b.endereco || '',
      cidade: b.cidade || '',
      uf: b.uf || 'SP',
      profissaoOuRamo: b.profissaoOuRamo || '',
      estadoCivil: b.estadoCivil || '',
      nacionalidade: b.nacionalidade || '',
      observacoes: b.observacoes || '',
    },
  })
  res.status(201).json(cliente)
})

clientesRouter.patch('/:id', async (req: AuthedRequest, res) => {
  const existente = await prisma.cliente.findFirst({
    where: { id: req.params.id, escritorioId: req.auth!.escritorioId },
  })
  if (!existente) return res.status(404).json({ error: 'Cliente não encontrado.' })
  const b = req.body ?? {}
  const cliente = await prisma.cliente.update({
    where: { id: existente.id },
    data: {
      nome: b.nome ?? existente.nome,
      tipo: b.tipo ?? existente.tipo,
      cpfCnpj: b.cpfCnpj ?? existente.cpfCnpj,
      email: b.email ?? existente.email,
      telefone: b.telefone ?? existente.telefone,
      endereco: b.endereco ?? existente.endereco,
      cidade: b.cidade ?? existente.cidade,
      uf: b.uf ?? existente.uf,
      profissaoOuRamo: b.profissaoOuRamo ?? existente.profissaoOuRamo,
      estadoCivil: b.estadoCivil ?? existente.estadoCivil,
      nacionalidade: b.nacionalidade ?? existente.nacionalidade,
      observacoes: b.observacoes ?? existente.observacoes,
    },
  })
  res.json(cliente)
})

clientesRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const existente = await prisma.cliente.findFirst({
    where: { id: req.params.id, escritorioId: req.auth!.escritorioId },
  })
  if (!existente) return res.status(404).json({ error: 'Cliente não encontrado.' })
  await prisma.cliente.delete({ where: { id: existente.id } })
  res.status(204).end()
})
