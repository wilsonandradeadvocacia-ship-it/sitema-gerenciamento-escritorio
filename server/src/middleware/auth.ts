import type { NextFunction, Request, Response } from 'express'
import { verifyToken, type TokenPayload } from '../lib/jwt.js'

export interface AuthedRequest extends Request {
  auth?: TokenPayload
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado.' })
  }
  try {
    const token = header.slice('Bearer '.length)
    req.auth = verifyToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' })
  }
}
