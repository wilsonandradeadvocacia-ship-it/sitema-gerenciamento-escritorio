import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireSuperAdmin } from '../middleware/superAdmin.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireSuperAdmin)

adminRouter.get('/escritorios', async (_req, res) => {
  const escritorios = await prisma.escritorio.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { clientes: true, contratos: true, users: true } },
      users: { select: { email: true, nome: true }, take: 1, orderBy: { createdAt: 'asc' } },
    },
  })
  res.json(
    escritorios.map((e) => ({
      id: e.id,
      nomeEscritorio: e.nomeEscritorio,
      nomeAdvogadoResponsavel: e.nomeAdvogadoResponsavel,
      emailAdmin: e.users[0]?.email ?? '',
      createdAt: e.createdAt,
      ativo: e.ativo,
      planoStatus: e.planoStatus,
      trialAte: e.trialAte,
      dataProximoVencimento: e.dataProximoVencimento,
      totalUsuarios: e._count.users,
      totalClientes: e._count.clientes,
      totalContratos: e._count.contratos,
    })),
  )
})

adminRouter.patch('/escritorios/:id', async (req, res) => {
  const b = req.body ?? {}
  const escritorio = await prisma.escritorio.findUnique({ where: { id: req.params.id } })
  if (!escritorio) return res.status(404).json({ error: 'Escritório não encontrado.' })

  const atualizado = await prisma.escritorio.update({
    where: { id: escritorio.id },
    data: {
      ...(b.ativo !== undefined && { ativo: Boolean(b.ativo) }),
      ...(b.planoStatus !== undefined && { planoStatus: b.planoStatus }),
      ...(b.trialAte !== undefined && { trialAte: b.trialAte ? new Date(b.trialAte) : null }),
    },
  })
  res.json({ id: atualizado.id, ativo: atualizado.ativo, planoStatus: atualizado.planoStatus, trialAte: atualizado.trialAte })
})
