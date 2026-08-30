import type { EscritorioConfig } from '../types'

export function emTrialValido(escritorio: Pick<EscritorioConfig, 'planoStatus' | 'trialAte'>): boolean {
  return (
    escritorio.planoStatus === 'trial' && !!escritorio.trialAte && new Date(escritorio.trialAte) >= new Date()
  )
}

export function contaBloqueada(
  escritorio: Pick<EscritorioConfig, 'ativo' | 'planoStatus' | 'trialAte'>,
): boolean {
  const assinaturaAtiva = escritorio.planoStatus === 'ativo'
  return escritorio.ativo === false || (!emTrialValido(escritorio) && !assinaturaAtiva)
}
