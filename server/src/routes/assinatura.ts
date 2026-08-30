import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { criarOuObterCliente, criarAssinatura, obterPrimeiraCobranca } from '../lib/asaas.js'

export const assinaturaRouter = Router()

const VALOR_PLANO_MENSAL = Number(process.env.VALOR_PLANO_MENSAL || 14.9)

assinaturaRouter.post('/checkout', requireAuth, async (req: AuthedRequest, res) => {
  const escritorio = await prisma.escritorio.findUnique({ where: { id: req.auth!.escritorioId } })
  if (!escritorio) return res.status(404).json({ error: 'Escritório não encontrado.' })

  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })

  try {
    const cliente = await criarOuObterCliente({
      name: escritorio.nomeEscritorio,
      cpfCnpj: escritorio.cpfCnpj,
      email: user.email,
      existingId: escritorio.asaasCustomerId,
    })

    let subscriptionId = escritorio.asaasSubscriptionId
    if (!subscriptionId) {
      const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const assinatura = await criarAssinatura({
        customerId: cliente.id,
        valor: VALOR_PLANO_MENSAL,
        descricao: 'Assinatura mensal - Sistema de Gestão de Honorários',
        diaVencimento: amanha,
      })
      subscriptionId = assinatura.id
    }

    await prisma.escritorio.update({
      where: { id: escritorio.id },
      data: { asaasCustomerId: cliente.id, asaasSubscriptionId: subscriptionId },
    })

    const primeiraCobranca = await obterPrimeiraCobranca(subscriptionId)
    if (!primeiraCobranca) {
      return res.status(500).json({ error: 'Não foi possível gerar a cobrança. Tente novamente em instantes.' })
    }

    res.json({ invoiceUrl: primeiraCobranca.invoiceUrl })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao iniciar assinatura.' })
  }
})

assinaturaRouter.post('/webhook', async (req, res) => {
  const token = req.headers['asaas-access-token']
  if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido.' })
  }

  const evento = req.body?.event as string | undefined
  const payment = req.body?.payment
  const subscriptionId = payment?.subscription as string | undefined
  if (!evento || !subscriptionId) return res.status(200).json({ ok: true })

  const escritorio = await prisma.escritorio.findFirst({ where: { asaasSubscriptionId: subscriptionId } })
  if (!escritorio) return res.status(200).json({ ok: true })

  if (evento === 'PAYMENT_RECEIVED' || evento === 'PAYMENT_CONFIRMED') {
    const proximoVencimento = payment?.nextDueDate ? new Date(payment.nextDueDate) : null
    await prisma.escritorio.update({
      where: { id: escritorio.id },
      data: { planoStatus: 'ativo', dataProximoVencimento: proximoVencimento },
    })
  } else if (evento === 'PAYMENT_OVERDUE') {
    await prisma.escritorio.update({ where: { id: escritorio.id }, data: { planoStatus: 'inadimplente' } })
  } else if (evento === 'SUBSCRIPTION_DELETED' || evento === 'PAYMENT_DELETED') {
    await prisma.escritorio.update({ where: { id: escritorio.id }, data: { planoStatus: 'cancelado' } })
  }

  res.status(200).json({ ok: true })
})
