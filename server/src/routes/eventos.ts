import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const eventosRouter = Router()
eventosRouter.use(requireAuth)

eventosRouter.get('/', async (req: AuthedRequest, res) => {
  const eventos = await prisma.eventoAgenda.findMany({
    where: { escritorioId: req.auth!.escritorioId },
    orderBy: { data: 'asc' },
  })
  res.json(eventos)
})

eventosRouter.post('/', async (req: AuthedRequest, res) => {
  const b = req.body ?? {}
  if (!b.titulo || !b.data) return res.status(400).json({ error: 'Título e data são obrigatórios.' })
  const evento = await prisma.eventoAgenda.create({
    data: {
      escritorioId: req.auth!.escritorioId,
      titulo: b.titulo,
      data: b.data,
      tipo: b.tipo || 'outro',
      clienteId: b.clienteId || null,
      descricao: b.descricao || '',
      concluido: false,
    },
  })
  res.status(201).json(evento)
})

eventosRouter.patch('/:id', async (req: AuthedRequest, res) => {
  const existente = await prisma.eventoAgenda.findFirst({
    where: { id: req.params.id, escritorioId: req.auth!.escritorioId },
  })
  if (!existente) return res.status(404).json({ error: 'Evento não encontrado.' })
  const b = req.body ?? {}
  const evento = await prisma.eventoAgenda.update({
    where: { id: existente.id },
    data: {
      concluido: b.concluido !== undefined ? b.concluido : !existente.concluido,
    },
  })
  res.json(evento)
})

eventosRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const existente = await prisma.eventoAgenda.findFirst({
    where: { id: req.params.id, escritorioId: req.auth!.escritorioId },
  })
  if (!existente) return res.status(404).json({ error: 'Evento não encontrado.' })
  await prisma.eventoAgenda.delete({ where: { id: existente.id } })
  res.status(204).end()
})
