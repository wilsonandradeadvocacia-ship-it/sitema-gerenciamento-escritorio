import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const escritorioRouter = Router()
escritorioRouter.use(requireAuth)

escritorioRouter.patch('/', async (req: AuthedRequest, res) => {
  const { nomeEscritorio, nomeAdvogadoResponsavel, oabNumero, oabUf, cpfCnpj, endereco } = req.body ?? {}
  const escritorio = await prisma.escritorio.update({
    where: { id: req.auth!.escritorioId },
    data: {
      ...(nomeEscritorio !== undefined && { nomeEscritorio }),
      ...(nomeAdvogadoResponsavel !== undefined && { nomeAdvogadoResponsavel }),
      ...(oabNumero !== undefined && { oabNumero }),
      ...(oabUf !== undefined && { oabUf }),
      ...(cpfCnpj !== undefined && { cpfCnpj }),
      ...(endereco !== undefined && { endereco }),
    },
  })
  return res.json({
    id: escritorio.id,
    nomeEscritorio: escritorio.nomeEscritorio,
    nomeAdvogadoResponsavel: escritorio.nomeAdvogadoResponsavel,
    oabNumero: escritorio.oabNumero,
    oabUf: escritorio.oabUf,
    cpfCnpj: escritorio.cpfCnpj,
    endereco: escritorio.endereco,
  })
})
