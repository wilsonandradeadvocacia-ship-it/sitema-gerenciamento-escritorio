export type PessoaTipo = 'fisica' | 'juridica'

export interface Cliente {
  id: string
  nome: string
  tipo: PessoaTipo
  cpfCnpj: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  uf: string
  profissaoOuRamo: string
  estadoCivil?: string
  nacionalidade?: string
  observacoes?: string
  criadoEm: string
}

export type TipoValorHonorario = 'fixo' | 'percentual_valor_causa' | 'percentual_exito' | 'hora'

export interface ItemTabelaHonorarios {
  id: string
  categoria: string
  tipo: TipoValorHonorario
  valorMin?: number
  valorMax?: number
  percMin?: number
  percMax?: number
  observacao?: string
}

export interface TabelaHonorariosOAB {
  uf: string
  nomeSeccional: string
  vigencia: string
  fonteUrl?: string
  statusDados: 'pesquisado' | 'parcial' | 'generico'
  itens: ItemTabelaHonorarios[]
}

export type FormaPagamento = 'avista' | 'parcelado' | 'mensal_continuado'

export interface ParcelaContrato {
  id: string
  numero: number
  descricao: string
  valor: number
  dataVencimento: string
  status: 'previsto' | 'recebido' | 'atrasado'
  dataRecebimento?: string
}

export interface ContratoHonorarios {
  id: string
  clienteId: string
  criadoEm: string
  uf: string
  servico: string
  descricaoServico: string
  origemValor: 'tabela_oab' | 'manual'
  itemTabelaId?: string
  valorHonorarios: number
  formaPagamento: FormaPagamento
  numeroParcelas: number
  primeiraParcelaData: string
  parcelas: ParcelaContrato[]
  clausulasAdicionais?: string
  assinado: boolean
  dataAssinatura?: string
  procuracaoPoderes?: string
  status: 'rascunho' | 'assinado' | 'cancelado'
}

export type TipoEventoAgenda = 'pagamento' | 'audiencia' | 'prazo' | 'reuniao' | 'outro'

export interface EventoAgenda {
  id: string
  titulo: string
  data: string
  tipo: TipoEventoAgenda
  clienteId?: string
  contratoId?: string
  parcelaId?: string
  valor?: number
  descricao?: string
  concluido: boolean
}

export type StatusLancamento = 'previsto' | 'recebido' | 'atrasado' | 'cancelado'

export interface EscritorioConfig {
  nomeEscritorio: string
  nomeAdvogadoResponsavel: string
  oabNumero: string
  oabUf: string
  cpfCnpj: string
  endereco: string
}

export interface LancamentoFinanceiro {
  id: string
  clienteId: string
  contratoId: string
  parcelaId: string
  descricao: string
  valor: number
  dataVencimento: string
  dataRecebimento?: string
  status: StatusLancamento
}
