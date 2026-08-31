/**
 * O Visto — elemento de assinatura da marca.
 *
 * Uma linha de assinatura reta cuja ponta direita sobe num visto, feita num
 * traço só. Este arquivo é a ÚNICA fonte da geometria: nenhuma tela deve
 * redesenhar o traço à mão.
 *
 * Regras fixas (não são gosto, são o que separa a marca de um checkmark
 * genérico de app):
 *  - linha longa e baixa, subida curta no fim;
 *  - nunca um tique solto — o traço sempre pousa numa base horizontal;
 *  - posição de rubrica: rodapé, à direita, embaixo do que ele confere;
 *  - tinta azul-caneta (`text-caneta-600`), não azul institucional.
 *
 * Dois cortes do mesmo traço:
 *  - `master`  (3,6:1) para uso grande — assinatura de documento, marca d'água.
 *  - `compact` (1,7:1) para uso pequeno — favicon, chip de status, badge.
 *    É correção óptica: na proporção do master, a 16px sobra um fio de cabelo.
 */

import { useId } from 'react'

const CUTS = {
  master: {
    viewBox: '0 0 356 98',
    ratio: 356 / 98,
    d: 'M2.2 70.5 L255.7 81.4 L351 1.9 A1.5 1.5 0 0 1 353 4.1 L260.3 94.7 L1.9 75.5 A2.5 2.5 0 0 1 2.2 70.5 Z',
  },
  compact: {
    viewBox: '0 0 40 23',
    ratio: 40 / 23,
    d: 'M1 17.5 L27 18.6 L37 0.5 A1.6 1.6 0 0 1 39.4 1.8 L30 22.5 L0.6 21.4 A2 2 0 0 1 1 17.5 Z',
  },
} as const

export type VistoCut = keyof typeof CUTS

type VistoProps = {
  /** Altura em px. A largura sai da proporção do corte. */
  height?: number
  cut?: VistoCut
  /** Desenha o traço da esquerda para a direita ao montar. */
  draw?: boolean
  /** Nome acessível. Sem ele o traço é decorativo e some para leitores de tela. */
  title?: string
  className?: string
}

export default function Visto({
  height = 14,
  cut = 'compact',
  draw = false,
  title,
  className = '',
}: VistoProps) {
  const uid = useId()
  const clipId = `visto-clip-${uid.replace(/[^a-zA-Z0-9-]/g, '')}`
  const { viewBox, ratio, d } = CUTS[cut]
  const [, , vbW, vbH] = viewBox.split(' ').map(Number)

  const mark = <path d={d} fill="currentColor" />

  return (
    <svg
      viewBox={viewBox}
      width={height * ratio}
      height={height}
      className={`inline-block shrink-0 ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {draw ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={vbW} height={vbH} className="visto-sweep" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>{mark}</g>
        </>
      ) : (
        mark
      )}
    </svg>
  )
}

/**
 * Rubrica de rodapé: o traço na posição canônica, com a etiqueta em caixa
 * alta embaixo. É o que fecha todo documento gerado pelo sistema.
 */
export function RubricaVisto({ etiqueta = 'GERADO' }: { etiqueta?: string }) {
  return (
    <div className="flex flex-col items-end gap-1.5 leading-none">
      <Visto cut="master" height={24} className="text-caneta-600" />
      <span className="text-[8px] tracking-[0.12em] text-slate-400 font-sans">{etiqueta}</span>
    </div>
  )
}
