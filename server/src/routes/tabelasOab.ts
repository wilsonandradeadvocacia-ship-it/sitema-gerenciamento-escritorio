import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { requireAssinaturaAtiva } from '../middleware/assinatura.js'

export const tabelasOabRouter = Router()
tabelasOabRouter.use(requireAuth, requireAssinaturaAtiva)

function serializar(t: {
  uf: string
  nomeSeccional: string
  vigencia: string
  fonteUrl: string | null
  statusDados: string
  itensJson: string
}) {
  return {
    uf: t.uf,
    nomeSeccional: t.nomeSeccional,
    vigencia: t.vigencia,
    fonteUrl: t.fonteUrl ?? undefined,
    statusDados: t.statusDados,
    itens: JSON.parse(t.itensJson),
  }
}

tabelasOabRouter.get('/', async (req: AuthedRequest, res) => {
  const tabelas = await prisma.tabelaOAB.findMany({ where: { escritorioId: req.auth!.escritorioId } })
  res.json(tabelas.map(serializar))
})

tabelasOabRouter.patch('/:uf', async (req: AuthedRequest, res) => {
  const b = req.body ?? {}
  const existente = await prisma.tabelaOAB.findUnique({
    where: { escritorioId_uf: { escritorioId: req.auth!.escritorioId, uf: req.params.uf } },
  })
  if (!existente) return res.status(404).json({ error: 'Tabela não encontrada para esta UF.' })

  const atualizada = await prisma.tabelaOAB.update({
    where: { id: existente.id },
    data: {
      vigencia: b.vigencia ?? existente.vigencia,
      fonteUrl: b.fonteUrl ?? existente.fonteUrl,
      statusDados: b.statusDados ?? existente.statusDados,
      itensJson: b.itens ? JSON.stringify(b.itens) : existente.itensJson,
    },
  })
  res.json(serializar(atualizada))
})
