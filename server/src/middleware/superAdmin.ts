import type { Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import type { AuthedRequest } from './auth.js'

function emailsSuperAdmin(): string[] {
  return (process.env.SUPERADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailSuperAdmin(email: string): boolean {
  return emailsSuperAdmin().includes(email.toLowerCase())
}

export async function requireSuperAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user || !isEmailSuperAdmin(user.email)) {
    return res.status(403).json({ error: 'Acesso restrito ao administrador da plataforma.' })
  }
  next()
}
