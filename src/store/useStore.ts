import { create } from 'zustand'
import { apiFetch } from '../api/client'
import type { Cliente, ContratoHonorarios, EventoAgenda, LancamentoFinanceiro, TabelaHonorariosOAB } from '../types'

interface Store {
  clientes: Cliente[]
  contratos: ContratoHonorarios[]
  lancamentos: LancamentoFinanceiro[]
  eventos: EventoAgenda[]
  tabelasOAB: Record<string, TabelaHonorariosOAB>
  carregado: boolean

  carregarTudo: () => Promise<void>
  limpar: () => void

  addCliente: (c: Omit<Cliente, 'id' | 'criadoEm'>) => Promise<Cliente>
  updateCliente: (id: string, patch: Partial<Cliente>) => Promise<void>
  removeCliente: (id: string) => Promise<void>

  updateTabelaOAB: (uf: string, tabela: TabelaHonorariosOAB) => Promise<void>

  criarContrato: (input: {
    clienteId: string
    uf: string
    servico: string
    descricaoServico: string
    origemValor: 'tabela_oab' | 'manual'
    itemTabelaId?: string
    valorHonorarios: number
    percentualExito?: number
    formaPagamento: ContratoHonorarios['formaPagamento']
    numeroParcelas: number
    primeiraParcelaData: string
    clausulasAdicionais?: string
    procuracaoPoderes?: string
  }) => Promise<ContratoHonorarios>

  assinarContrato: (contratoId: string) => Promise<void>
  cancelarContrato: (contratoId: string) => Promise<void>

  marcarParcelaRecebida: (lancamentoId: string, dataRecebimento: string) => Promise<void>

  addEvento: (e: Omit<EventoAgenda, 'id' | 'concluido'>) => Promise<void>
  toggleEventoConcluido: (id: string) => Promise<void>
  removeEvento: (id: string) => Promise<void>
}

export const useStore = create<Store>()((set, get) => ({
  clientes: [],
  contratos: [],
  lancamentos: [],
  eventos: [],
  tabelasOAB: {},
  carregado: false,

  carregarTudo: async () => {
    const [clientes, contratos, lancamentos, eventos, tabelas] = await Promise.all([
      apiFetch<Cliente[]>('/api/clientes'),
      apiFetch<ContratoHonorarios[]>('/api/contratos'),
      apiFetch<LancamentoFinanceiro[]>('/api/lancamentos'),
      apiFetch<EventoAgenda[]>('/api/eventos'),
      apiFetch<TabelaHonorariosOAB[]>('/api/tabelas-oab'),
    ])
    set({
      clientes,
      contratos,
      lancamentos,
      eventos,
      tabelasOAB: Object.fromEntries(tabelas.map((t) => [t.uf, t])),
      carregado: true,
    })
  },

  limpar: () =>
    set({ clientes: [], contratos: [], lancamentos: [], eventos: [], tabelasOAB: {}, carregado: false }),

  addCliente: async (c) => {
    const cliente = await apiFetch<Cliente>('/api/clientes', { method: 'POST', body: JSON.stringify(c) })
    set((s) => ({ clientes: [cliente, ...s.clientes] }))
    return cliente
  },
  updateCliente: async (id, patch) => {
    const cliente = await apiFetch<Cliente>(`/api/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
    set((s) => ({ clientes: s.clientes.map((c) => (c.id === id ? cliente : c)) }))
  },
  removeCliente: async (id) => {
    await apiFetch(`/api/clientes/${id}`, { method: 'DELETE' })
    set((s) => ({ clientes: s.clientes.filter((c) => c.id !== id) }))
  },

  updateTabelaOAB: async (uf, tabela) => {
    const atualizada = await apiFetch<TabelaHonorariosOAB>(`/api/tabelas-oab/${uf}`, {
      method: 'PATCH',
      body: JSON.stringify(tabela),
    })
    set((s) => ({ tabelasOAB: { ...s.tabelasOAB, [uf]: atualizada } }))
  },

  criarContrato: async (input) => {
    const contrato = await apiFetch<ContratoHonorarios>('/api/contratos', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    set((s) => ({ contratos: [contrato, ...s.contratos] }))
    return contrato
  },

  assinarContrato: async (contratoId) => {
    const contrato = await apiFetch<ContratoHonorarios>(`/api/contratos/${contratoId}/assinar`, { method: 'POST' })
    set((s) => ({ contratos: s.contratos.map((c) => (c.id === contratoId ? contrato : c)) }))
    // recarrega financeiro e agenda, que foram alimentados automaticamente pelo servidor
    const [lancamentos, eventos] = await Promise.all([
      apiFetch<LancamentoFinanceiro[]>('/api/lancamentos'),
      apiFetch<EventoAgenda[]>('/api/eventos'),
    ])
    set({ lancamentos, eventos })
  },

  cancelarContrato: async (contratoId) => {
    const contrato = await apiFetch<ContratoHonorarios>(`/api/contratos/${contratoId}/cancelar`, { method: 'POST' })
    set((s) => ({ contratos: s.contratos.map((c) => (c.id === contratoId ? contrato : c)) }))
  },

  marcarParcelaRecebida: async (lancamentoId, dataRecebimento) => {
    const lancamento = await apiFetch<LancamentoFinanceiro>(`/api/lancamentos/${lancamentoId}/marcar-recebido`, {
      method: 'POST',
      body: JSON.stringify({ dataRecebimento }),
    })
    set((s) => ({
      lancamentos: s.lancamentos.map((l) => (l.id === lancamentoId ? lancamento : l)),
      eventos: s.eventos.map((e) => (e.parcelaId === lancamento.parcelaId ? { ...e, concluido: true } : e)),
      contratos: s.contratos.map((c) =>
        c.id === lancamento.contratoId
          ? {
              ...c,
              parcelas: c.parcelas.map((p) =>
                p.id === lancamento.parcelaId ? { ...p, status: 'recebido', dataRecebimento } : p,
              ),
            }
          : c,
      ),
    }))
  },

  addEvento: async (e) => {
    const evento = await apiFetch<EventoAgenda>('/api/eventos', { method: 'POST', body: JSON.stringify(e) })
    set((s) => ({ eventos: [...s.eventos, evento] }))
  },
  toggleEventoConcluido: async (id) => {
    const atual = get().eventos.find((e) => e.id === id)
    if (!atual) return
    const evento = await apiFetch<EventoAgenda>(`/api/eventos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ concluido: !atual.concluido }),
    })
    set((s) => ({ eventos: s.eventos.map((e) => (e.id === id ? evento : e)) }))
  },
  removeEvento: async (id) => {
    await apiFetch(`/api/eventos/${id}`, { method: 'DELETE' })
    set((s) => ({ eventos: s.eventos.filter((e) => e.id !== id) }))
  },
}))
