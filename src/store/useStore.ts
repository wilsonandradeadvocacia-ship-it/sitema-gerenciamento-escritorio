import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type {
  Cliente,
  ContratoHonorarios,
  EscritorioConfig,
  EventoAgenda,
  LancamentoFinanceiro,
  ParcelaContrato,
  TabelaHonorariosOAB,
} from '../types'
import { TABELAS_HONORARIOS_PADRAO } from '../data/tabelasHonorarios'

const ESCRITORIO_PADRAO: EscritorioConfig = {
  nomeEscritorio: '[Nome do Escritório de Advocacia]',
  nomeAdvogadoResponsavel: '[Nome do(a) Advogado(a) responsável]',
  oabNumero: '[nº]',
  oabUf: 'SP',
  cpfCnpj: '[CPF/CNPJ]',
  endereco: '[Endereço completo do escritório]',
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

interface Store {
  clientes: Cliente[]
  contratos: ContratoHonorarios[]
  lancamentos: LancamentoFinanceiro[]
  eventos: EventoAgenda[]
  tabelasOAB: Record<string, TabelaHonorariosOAB>
  escritorio: EscritorioConfig

  updateEscritorio: (patch: Partial<EscritorioConfig>) => void

  addCliente: (c: Omit<Cliente, 'id' | 'criadoEm'>) => Cliente
  updateCliente: (id: string, patch: Partial<Cliente>) => void
  removeCliente: (id: string) => void

  updateTabelaOAB: (uf: string, tabela: TabelaHonorariosOAB) => void

  criarContrato: (input: {
    clienteId: string
    uf: string
    servico: string
    descricaoServico: string
    origemValor: 'tabela_oab' | 'manual'
    itemTabelaId?: string
    valorHonorarios: number
    formaPagamento: ContratoHonorarios['formaPagamento']
    numeroParcelas: number
    primeiraParcelaData: string
    clausulasAdicionais?: string
    procuracaoPoderes?: string
  }) => ContratoHonorarios

  assinarContrato: (contratoId: string) => void
  cancelarContrato: (contratoId: string) => void

  marcarParcelaRecebida: (lancamentoId: string, dataRecebimento: string) => void

  addEvento: (e: Omit<EventoAgenda, 'id' | 'concluido'>) => void
  toggleEventoConcluido: (id: string) => void
  removeEvento: (id: string) => void
}

function gerarParcelas(
  valorTotal: number,
  numeroParcelas: number,
  primeiraData: string,
  formaPagamento: ContratoHonorarios['formaPagamento'],
): ParcelaContrato[] {
  const n = Math.max(1, numeroParcelas)
  const valorParcela = Math.round((valorTotal / n) * 100) / 100
  const parcelas: ParcelaContrato[] = []
  let somaAcumulada = 0
  for (let i = 0; i < n; i++) {
    const isUltima = i === n - 1
    const valor = isUltima ? Math.round((valorTotal - somaAcumulada) * 100) / 100 : valorParcela
    somaAcumulada += valor
    parcelas.push({
      id: uuid(),
      numero: i + 1,
      descricao:
        formaPagamento === 'mensal_continuado'
          ? `Mensalidade ${i + 1}`
          : n === 1
          ? 'Pagamento único'
          : `Parcela ${i + 1}/${n}`,
      valor,
      dataVencimento: addMonths(primeiraData, i),
      status: 'previsto',
    })
  }
  return parcelas
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      clientes: [],
      contratos: [],
      lancamentos: [],
      eventos: [],
      tabelasOAB: TABELAS_HONORARIOS_PADRAO,
      escritorio: ESCRITORIO_PADRAO,

      updateEscritorio: (patch) => set((s) => ({ escritorio: { ...s.escritorio, ...patch } })),

      addCliente: (c) => {
        const cliente: Cliente = { ...c, id: uuid(), criadoEm: new Date().toISOString() }
        set((s) => ({ clientes: [...s.clientes, cliente] }))
        return cliente
      },
      updateCliente: (id, patch) =>
        set((s) => ({ clientes: s.clientes.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCliente: (id) => set((s) => ({ clientes: s.clientes.filter((c) => c.id !== id) })),

      updateTabelaOAB: (uf, tabela) =>
        set((s) => ({ tabelasOAB: { ...s.tabelasOAB, [uf]: tabela } })),

      criarContrato: (input) => {
        const parcelas = gerarParcelas(
          input.valorHonorarios,
          input.numeroParcelas,
          input.primeiraParcelaData,
          input.formaPagamento,
        )
        const contrato: ContratoHonorarios = {
          id: uuid(),
          criadoEm: new Date().toISOString(),
          clienteId: input.clienteId,
          uf: input.uf,
          servico: input.servico,
          descricaoServico: input.descricaoServico,
          origemValor: input.origemValor,
          itemTabelaId: input.itemTabelaId,
          valorHonorarios: input.valorHonorarios,
          formaPagamento: input.formaPagamento,
          numeroParcelas: input.numeroParcelas,
          primeiraParcelaData: input.primeiraParcelaData,
          parcelas,
          clausulasAdicionais: input.clausulasAdicionais,
          procuracaoPoderes: input.procuracaoPoderes,
          assinado: false,
          status: 'rascunho',
        }
        set((s) => ({ contratos: [...s.contratos, contrato] }))
        return contrato
      },

      assinarContrato: (contratoId) => {
        const contrato = get().contratos.find((c) => c.id === contratoId)
        if (!contrato || contrato.assinado) return
        const dataAssinatura = new Date().toISOString()

        set((s) => ({
          contratos: s.contratos.map((c) =>
            c.id === contratoId ? { ...c, assinado: true, dataAssinatura, status: 'assinado' } : c,
          ),
        }))

        const novosLancamentos: LancamentoFinanceiro[] = contrato.parcelas.map((p) => ({
          id: uuid(),
          clienteId: contrato.clienteId,
          contratoId: contrato.id,
          parcelaId: p.id,
          descricao: `${contrato.servico} - ${p.descricao}`,
          valor: p.valor,
          dataVencimento: p.dataVencimento,
          status: 'previsto',
        }))

        const cliente = get().clientes.find((c) => c.id === contrato.clienteId)
        const novosEventos: EventoAgenda[] = contrato.parcelas.map((p) => ({
          id: uuid(),
          titulo: `Recebimento: ${cliente?.nome ?? 'Cliente'} - ${p.descricao}`,
          data: p.dataVencimento,
          tipo: 'pagamento',
          clienteId: contrato.clienteId,
          contratoId: contrato.id,
          parcelaId: p.id,
          valor: p.valor,
          descricao: contrato.servico,
          concluido: false,
        }))

        set((s) => ({
          lancamentos: [...s.lancamentos, ...novosLancamentos],
          eventos: [...s.eventos, ...novosEventos],
        }))
      },

      cancelarContrato: (contratoId) =>
        set((s) => ({
          contratos: s.contratos.map((c) => (c.id === contratoId ? { ...c, status: 'cancelado' } : c)),
        })),

      marcarParcelaRecebida: (lancamentoId, dataRecebimento) => {
        set((s) => ({
          lancamentos: s.lancamentos.map((l) =>
            l.id === lancamentoId ? { ...l, status: 'recebido', dataRecebimento } : l,
          ),
        }))
        const lanc = get().lancamentos.find((l) => l.id === lancamentoId)
        if (!lanc) return
        set((s) => ({
          contratos: s.contratos.map((c) =>
            c.id === lanc.contratoId
              ? {
                  ...c,
                  parcelas: c.parcelas.map((p) =>
                    p.id === lanc.parcelaId ? { ...p, status: 'recebido', dataRecebimento } : p,
                  ),
                }
              : c,
          ),
          eventos: s.eventos.map((e) => (e.parcelaId === lanc.parcelaId ? { ...e, concluido: true } : e)),
        }))
      },

      addEvento: (e) => set((s) => ({ eventos: [...s.eventos, { ...e, id: uuid(), concluido: false }] })),
      toggleEventoConcluido: (id) =>
        set((s) => ({ eventos: s.eventos.map((e) => (e.id === id ? { ...e, concluido: !e.concluido } : e)) })),
      removeEvento: (id) => set((s) => ({ eventos: s.eventos.filter((e) => e.id !== id) })),
    }),
    {
      name: 'escritorio-honorarios-storage',
      version: 1,
      merge: (persisted, current) => {
        const p = persisted as Partial<Store> | undefined
        return {
          ...current,
          ...p,
          tabelasOAB: { ...current.tabelasOAB, ...(p?.tabelasOAB ?? {}) },
        }
      },
    },
  ),
)

export function calcularStatusParcela(dataVencimento: string, status: ParcelaContrato['status']) {
  if (status === 'recebido') return 'recebido'
  const hoje = new Date().toISOString().slice(0, 10)
  return dataVencimento < hoje ? 'atrasado' : 'previsto'
}
