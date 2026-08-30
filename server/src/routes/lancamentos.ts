import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { requireAssinaturaAtiva } from '../middleware/assinatura.js'

export const lancamentosRouter = Router()
lancamentosRouter.use(requireAuth, requireAssinaturaAtiva)

lancamentosRouter.get('/', async (req: AuthedRequest, res) => {
  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where: { escritorioId: req.auth!.escritorioId },
    orderBy: { dataVencimento: 'asc' },
  })
  res.json(lancamentos)
})

lancamentosRouter.post('/:id/marcar-recebido', async (req: AuthedRequest, res) => {
  const lancamento = await prisma.lancamentoFinanceiro.findFirst({
    where: { id: req.params.id, escritorioId: req.auth!.escritorioId },
  })
  if (!lancamento) return res.status(404).json({ error: 'Lançamento não encontrado.' })

  const dataRecebimento = req.body?.dataRecebimento || new Date().toISOString().slice(0, 10)

  const atualizado = await prisma.$transaction(async (tx) => {
    const upd = await tx.lancamentoFinanceiro.update({
      where: { id: lancamento.id },
      data: { status: 'recebido', dataRecebimento },
    })

    const contrato = await tx.contrato.findUnique({ where: { id: lancamento.contratoId } })
    if (contrato) {
      const parcelas = JSON.parse(contrato.parcelasJson) as { id: string; status: string; dataRecebimento?: string }[]
      const novasParcelas = parcelas.map((p) =>
        p.id === lancamento.parcelaId ? { ...p, status: 'recebido', dataRecebimento } : p,
      )
      await tx.contrato.update({ where: { id: contrato.id }, data: { parcelasJson: JSON.stringify(novasParcelas) } })
    }

    await tx.eventoAgenda.updateMany({
      where: { parcelaId: lancamento.parcelaId, escritorioId: req.auth!.escritorioId },
      data: { concluido: true },
    })

    return upd
  })

  res.json(atualizado)
})
