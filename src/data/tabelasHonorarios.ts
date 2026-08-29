import { v4 as uuid } from 'uuid'
import { UFS } from './ufs'
import type { ItemTabelaHonorarios, TabelaHonorariosOAB, TipoValorHonorario } from '../types'
import { TABELAS_PESQUISADAS_RAW } from './tabelasHonorariosPesquisadas'

// Categorias-base usadas para montar a tabela genérica de qualquer seccional
// que ainda não teve seus valores oficiais conferidos e cadastrados.
// Os valores abaixo são apenas um ponto de partida razoável para uso interno
// do escritório e DEVEM ser conferidos e ajustados na tela "Tabelas OAB"
// com os valores oficiais vigentes da seccional antes de uso profissional.
function categoriasGenericas(): Omit<ItemTabelaHonorarios, 'id'>[] {
  return [
    { categoria: 'Consulta/parecer verbal', tipo: 'fixo', valorMin: 300, valorMax: 800 },
    { categoria: 'Parecer jurídico escrito', tipo: 'fixo', valorMin: 800, valorMax: 3000 },
    { categoria: 'Elaboração de contrato', tipo: 'fixo', valorMin: 600, valorMax: 2500 },
    { categoria: 'Ação cível - procedimento comum', tipo: 'percentual_valor_causa', percMin: 10, percMax: 20, valorMin: 2000 },
    { categoria: 'Ação trabalhista (reclamação)', tipo: 'percentual_valor_causa', percMin: 15, percMax: 30, valorMin: 1500 },
    { categoria: 'Ação de família (divórcio/guarda/alimentos)', tipo: 'fixo', valorMin: 2500, valorMax: 8000 },
    { categoria: 'Defesa criminal (1ª instância)', tipo: 'fixo', valorMin: 4000, valorMax: 15000 },
    { categoria: 'Inventário/arrolamento', tipo: 'percentual_valor_causa', percMin: 6, percMax: 15, valorMin: 3000 },
    { categoria: 'Execução (título extrajudicial/fiscal)', tipo: 'percentual_valor_causa', percMin: 10, percMax: 20, valorMin: 1500 },
    { categoria: 'Recurso (apelação/agravo)', tipo: 'fixo', valorMin: 1500, valorMax: 6000 },
    { categoria: 'Juizado Especial Cível', tipo: 'fixo', valorMin: 800, valorMax: 3000 },
    { categoria: 'Habeas corpus', tipo: 'fixo', valorMin: 2000, valorMax: 8000 },
    { categoria: 'Mandado de segurança', tipo: 'fixo', valorMin: 2500, valorMax: 10000 },
    { categoria: 'Consultoria/assessoria mensal', tipo: 'hora', valorMin: 800, valorMax: 5000, observacao: 'Valor mensal para contrato de assessoria continuada' },
    { categoria: 'Honorários de êxito', tipo: 'percentual_exito', percMin: 10, percMax: 30, observacao: 'Percentual sobre o proveito econômico obtido' },
  ]
}

function montarGenerica(uf: string, seccional: string): TabelaHonorariosOAB {
  return {
    uf,
    nomeSeccional: seccional,
    vigencia: 'não verificada',
    statusDados: 'generico',
    itens: categoriasGenericas().map((i) => ({ ...i, id: uuid() })),
  }
}

// Agrupamento por tópico usado para evitar duplicar, na tabela final, uma categoria que
// já foi confirmada com dado real pesquisado — o item genérico correspondente é removido
// e só os tópicos ainda não cobertos pela pesquisa permanecem com o valor genérico interno.
const TOPICOS: { chave: string; termos: string[] }[] = [
  { chave: 'consulta', termos: ['consulta'] },
  { chave: 'parecer', termos: ['parecer'] },
  { chave: 'contrato', termos: ['contrato'] },
  { chave: 'civel', termos: ['cível', 'civel'] },
  { chave: 'trabalhista', termos: ['trabalhista', 'reclamatória', 'reclamação'] },
  { chave: 'familia', termos: ['divórcio', 'separação', 'guarda', 'alimentos', 'família', 'união estável'] },
  { chave: 'criminal', termos: ['criminal', 'júri', 'defesa criminal'] },
  { chave: 'inventario', termos: ['inventário', 'arrolamento'] },
  { chave: 'execucao', termos: ['execução'] },
  { chave: 'recurso', termos: ['recurso', 'apelação', 'agravo'] },
  { chave: 'juizado', termos: ['juizado'] },
  { chave: 'habeas', termos: ['habeas corpus'] },
  { chave: 'mandado', termos: ['mandado de segurança'] },
  { chave: 'consultoria', termos: ['consultoria', 'assessoria', 'mensal', 'hora do advogado'] },
]

function categoriaChave(categoria: string): string | null {
  const low = categoria.toLowerCase()
  for (const t of TOPICOS) {
    if (t.termos.some((termo) => low.includes(termo))) return t.chave
  }
  return null
}

function converterTipo(tipoRaw: string): TipoValorHonorario {
  if (tipoRaw.includes('hora')) return 'hora'
  if (tipoRaw.includes('exito') || tipoRaw.includes('êxito')) return 'percentual_exito'
  if (tipoRaw.includes('percentual')) return 'percentual_valor_causa'
  return 'fixo'
}

function converterItemPesquisado(raw: (typeof TABELAS_PESQUISADAS_RAW)[number]['itens'][number]): Omit<ItemTabelaHonorarios, 'id'> {
  const tipo = converterTipo(raw.tipo)
  const notaConfianca =
    raw.confianca === 'baixa'
      ? 'Valor de fonte secundária (não confirmado no PDF oficial) — confirme antes de usar.'
      : raw.confianca === 'media'
      ? 'Valor com confiança média — confirme no texto oficial vigente.'
      : undefined
  const observacao = [raw.obs, notaConfianca].filter(Boolean).join(' ')

  if (tipo === 'percentual_valor_causa' || tipo === 'percentual_exito') {
    return {
      categoria: raw.categoria,
      tipo,
      percMin: raw.percMin ?? raw.percFixo ?? 0,
      percMax: raw.percMax ?? raw.percFixo ?? 0,
      valorMin: raw.valorMinimoAbsoluto,
      observacao: observacao || undefined,
    }
  }
  return {
    categoria: raw.categoria,
    tipo,
    valorMin: raw.valorMin ?? raw.valorFixo,
    valorMax: raw.valorMax ?? raw.valorFixo,
    observacao: observacao || undefined,
  }
}

function montarTabelaPesquisada(raw: (typeof TABELAS_PESQUISADAS_RAW)[number]): TabelaHonorariosOAB {
  const itensReais = raw.itens.map((i) => ({ ...converterItemPesquisado(i), id: uuid() }))
  const chavesReais = new Set(itensReais.map((i) => categoriaChave(i.categoria)).filter(Boolean))
  const genericosRestantes = categoriasGenericas()
    .filter((g) => {
      const chave = categoriaChave(g.categoria)
      return !chave || !chavesReais.has(chave)
    })
    .map((g) => ({
      ...g,
      id: uuid(),
      observacao: [g.observacao, '(valor genérico interno — ainda não conferido com a tabela oficial)']
        .filter(Boolean)
        .join(' '),
    }))

  // SP teve cobertura ampla o suficiente (todas as categorias principais) para ser
  // tratada como integralmente pesquisada; as demais seccionais pesquisadas tiveram
  // cobertura parcial e mantêm categorias genéricas complementares.
  const statusDados = raw.uf === 'SP' ? 'pesquisado' : 'parcial'
  const itens = statusDados === 'pesquisado' ? itensReais : [...itensReais, ...genericosRestantes]

  return {
    uf: raw.uf,
    nomeSeccional: raw.nomeSeccional,
    vigencia: raw.vigencia,
    fonteUrl: raw.fonteUrl,
    statusDados,
    itens,
  }
}

export const TABELAS_HONORARIOS_PADRAO: Record<string, TabelaHonorariosOAB> = Object.fromEntries(
  UFS.map((uf) => {
    const pesquisada = TABELAS_PESQUISADAS_RAW.find((r) => r.uf === uf.sigla)
    return [uf.sigla, pesquisada ? montarTabelaPesquisada(pesquisada) : montarGenerica(uf.sigla, uf.seccional)]
  }),
)
