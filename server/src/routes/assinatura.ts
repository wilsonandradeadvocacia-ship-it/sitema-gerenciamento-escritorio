import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { criarOuObterCliente, criarCobrancaUnica } from '../lib/asaas.js'

export const assinaturaRouter = Router()

const VALOR_ACESSO = Number(process.env.VALOR_ACESSO || 19.9)

assinaturaRouter.post('/checkout', requireAuth, async (req: AuthedRequest, res) => {
  const escritorio = await prisma.escritorio.findUnique({ where: { id: req.auth!.escritorioId } })
  if (!escritorio) return res.status(404).json({ error: 'Escritório não encontrado.' })
  if (escritorio.planoStatus === 'ativo') {
    return res.status(409).json({ error: 'Este escritório já tem acesso liberado ao sistema.' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })

  try {
    const cliente = await criarOuObterCliente({
      name: escritorio.nomeEscritorio,
      cpfCnpj: escritorio.cpfCnpj,
      email: user.email,
      existingId: escritorio.asaasCustomerId,
    })

    const cobranca = await criarCobrancaUnica({
      customerId: cliente.id,
      valor: VALOR_ACESSO,
      descricao: 'Acesso ao Sistema de Gestão de Honorários (compra única)',
    })

    await prisma.escritorio.update({
      where: { id: escritorio.id },
      data: { asaasCustomerId: cliente.id, asaasPaymentId: cobranca.id },
    })

    res.json({ invoiceUrl: cobranca.invoiceUrl })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao gerar a cobrança.' })
  }
})

assinaturaRouter.post('/webhook', async (req, res) => {
  const token = req.headers['asaas-access-token']
  if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido.' })
  }

  const evento = req.body?.event as string | undefined
  const payment = req.body?.payment
  const paymentId = payment?.id as string | undefined
  if (!evento || !paymentId) return res.status(200).json({ ok: true })

  const escritorio = await prisma.escritorio.findFirst({ where: { asaasPaymentId: paymentId } })
  if (!escritorio) return res.status(200).json({ ok: true })

  if (evento === 'PAYMENT_RECEIVED' || evento === 'PAYMENT_CONFIRMED') {
    await prisma.escritorio.update({ where: { id: escritorio.id }, data: { planoStatus: 'ativo' } })
  } else if (evento === 'PAYMENT_DELETED' || evento === 'PAYMENT_REFUNDED') {
    await prisma.escritorio.update({ where: { id: escritorio.id }, data: { planoStatus: 'cancelado' } })
  }

  res.status(200).json({ ok: true })
})
