import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { gerarParcelas } from '../lib/parcelas.js'

export const contratosRouter = Router()
contratosRouter.use(requireAuth)

function serializar(c: { parcelasJson: string; [key: string]: unknown }) {
  const { parcelasJson, ...rest } = c
  return { ...rest, parcelas: JSON.parse(parcelasJson) }
}

contratosRouter.get('/', async (req: AuthedRequest, res) => {
  const contratos = await prisma.contrato.findMany({
    where: { escritorioId: req.auth!.escritorioId },
    orderBy: { criadoEm: 'desc' },
  })
  res.json(contratos.map(serializar))
})

contratosRouter.get('/:id', async (req: AuthedRequest, res) => {
  const contrato = await prisma.contrato.findFirst({
    where: { id: req.params.id, escritorioId: req.auth!.escritorioId },
  })
  if (!contrato) return res.status(404).json({ error: 'Contrato não encontrado.' })
  res.json(serializar(contrato))
})

contratosRouter.post('/', async (req: AuthedRequest, res) => {
  const b = req.body ?? {}
  const camposObrigatorios = ['clienteId', 'uf', 'servico', 'descricaoServico', 'valorHonorarios', 'formaPagamento', 'primeiraParcelaData']
  for (const campo of camposObrigatorios) {
    if (b[campo] === undefined || b[campo] === null || b[campo] === '') {
      return res.status(400).json({ error: `Campo obrigatório ausente: ${campo}` })
    }
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id: b.clienteId, escritorioId: req.auth!.escritorioId },
  })
  if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' })

  const numeroParcelas = b.formaPagamento === 'avista' ? 1 : Number(b.numeroParcelas) || 1
  const parcelas = gerarParcelas(Number(b.valorHonorarios), numeroParcelas, b.primeiraParcelaData, b.formaPagamento)

  const contrato = await prisma.contrato.create({
    data: {
      escritorioId: req.auth!.escritorioId,
      clienteId: cliente.id,
      uf: b.uf,
      servico: b.servico,
      descricaoServico: b.descricaoServico,
      origemValor: b.origemValor || 'manual',
      itemTabelaId: b.itemTabelaId,
      valorHonorarios: Number(b.valorHonorarios),
      percentualExito: b.percentualExito !== undefined && b.percentualExito !== null ? Number(b.percentualExito) : null,
      formaPagamento: b.formaPagamento,
      numeroParcelas,
      primeiraParcelaData: b.primeiraParcelaData,
      parcelasJson: JSON.stringify(parcelas),
      clausulasAdicionais: b.clausulasAdicionais,
      procuracaoPoderes: b.procuracaoPoderes,
    },
  })
  res.status(201).json(serializar(contrato))
})

contratosRouter.post('/:id/assinar', async (req: AuthedRequest, res) => {
  const contrato = await prisma.contrato.findFirst({
    where: { id: req.params.id, escritorioId: req.auth!.escritorioId },
  })
  if (!contrato) return res.status(404).json({ error: 'Contrato não encontrado.' })
  if (contrato.assinado) return res.status(409).json({ error: 'Este contrato já está assinado.' })

  const cliente = await prisma.cliente.findUnique({ where: { id: contrato.clienteId } })
  const parcelas: { id: string; descricao: string; valor: number; dataVencimento: string }[] = JSON.parse(
    contrato.parcelasJson,
  )
  const dataAssinatura = new Date().toISOString()

  const atualizado = await prisma.$transaction(async (tx) => {
    const c = await tx.contrato.update({
      where: { id: contrato.id },
      data: { assinado: true, dataAssinatura, status: 'assinado' },
    })

    await tx.lancamentoFinanceiro.createMany({
      data: parcelas.map((p) => ({
        escritorioId: req.auth!.escritorioId,
        clienteId: contrato.clienteId,
        contratoId: contrato.id,
        parcelaId: p.id,
        descricao: `${contrato.servico} - ${p.descricao}`,
        valor: p.valor,
        dataVencimento: p.dataVencimento,
        status: 'previsto',
      })),
    })

    await tx.eventoAgenda.createMany({
      data: parcelas.map((p) => ({
        escritorioId: req.auth!.escritorioId,
        titulo: `Recebimento: ${cliente?.nome ?? 'Cliente'} - ${p.descricao}`,
        data: p.dataVencimento,
        tipo: 'pagamento',
        clienteId: contrato.clienteId,
        contratoId: contrato.id,
        parcelaId: p.id,
        valor: p.valor,
        descricao: contrato.servico,
        concluido: false,
      })),
    })

    return c
  })

  res.json(serializar(atualizado))
})

contratosRouter.post('/:id/cancelar', async (req: AuthedRequest, res) => {
  const contrato = await prisma.contrato.findFirst({
    where: { id: req.params.id, escritorioId: req.auth!.escritorioId },
  })
  if (!contrato) return res.status(404).json({ error: 'Contrato não encontrado.' })
  const atualizado = await prisma.contrato.update({ where: { id: contrato.id }, data: { status: 'cancelado' } })
  res.json(serializar(atualizado))
})
