import type { Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import type { AuthedRequest } from './auth.js'
import { isEmailSuperAdmin } from './superAdmin.js'

export async function requireAssinaturaAtiva(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (user && isEmailSuperAdmin(user.email)) return next()

  const escritorio = await prisma.escritorio.findUnique({ where: { id: req.auth!.escritorioId } })
  if (!escritorio) return res.status(404).json({ error: 'Escritório não encontrado.' })

  if (!escritorio.ativo) {
    return res.status(402).json({ error: 'Esta conta está suspensa. Entre em contato com o suporte.', bloqueado: true })
  }

  const emTrialValido = escritorio.planoStatus === 'trial' && escritorio.trialAte && escritorio.trialAte >= new Date()
  const assinaturaAtiva = escritorio.planoStatus === 'ativo'

  if (!emTrialValido && !assinaturaAtiva) {
    return res.status(402).json({
      error: 'Seu período de teste terminou. Assine um plano para continuar usando o sistema.',
      bloqueado: true,
    })
  }

  next()
}
