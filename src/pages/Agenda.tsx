import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { formatBRL, formatDate, todayISO } from '../lib/format'
import type { TipoEventoAgenda } from '../types'

const tipoLabel: Record<TipoEventoAgenda, string> = {
  pagamento: 'Pagamento',
  audiencia: 'Audiência',
  prazo: 'Prazo',
  reuniao: 'Reunião',
  outro: 'Outro',
}

const tipoCor: Record<TipoEventoAgenda, string> = {
  pagamento: 'bg-gold-500',
  audiencia: 'bg-red-500',
  prazo: 'bg-amber-500',
  reuniao: 'bg-brand-500',
  outro: 'bg-slate-400',
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function Agenda() {
  const { eventos, clientes, addEvento, toggleEventoConcluido, removeEvento } = useStore()
  const [mesRef, setMesRef] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [novoAberto, setNovoAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [data, setData] = useState(todayISO())
  const [tipo, setTipo] = useState<TipoEventoAgenda>('reuniao')

  const diasDoMes = useMemo(() => {
    const ano = mesRef.getFullYear()
    const mes = mesRef.getMonth()
    const primeiro = new Date(ano, mes, 1)
    const ultimo = new Date(ano, mes + 1, 0)
    const inicioSemana = primeiro.getDay()
    const dias: (Date | null)[] = []
    for (let i = 0; i < inicioSemana; i++) dias.push(null)
    for (let d = 1; d <= ultimo.getDate(); d++) dias.push(new Date(ano, mes, d))
    return dias
  }, [mesRef])

  const eventosPorDia = useMemo(() => {
    const map: Record<string, typeof eventos> = {}
    for (const e of eventos) {
      map[e.data] = [...(map[e.data] ?? []), e]
    }
    return map
  }, [eventos])

  const proximos = useMemo(
    () =>
      eventos
        .filter((e) => !e.concluido)
        .sort((a, b) => a.data.localeCompare(b.data))
        .slice(0, 15),
    [eventos],
  )

  async function salvarEvento() {
    if (!titulo.trim()) return
    try {
      await addEvento({ titulo, data, tipo, descricao: '' })
      setTitulo('')
      setNovoAberto(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar compromisso.')
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-900">Agenda</h1>
          <p className="text-slate-500 text-sm mt-1">
            Compromissos e datas de recebimentos previstos nos contratos de honorários.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setNovoAberto((v) => !v)}>
          + Novo compromisso
        </button>
      </header>

      {novoAberto && (
        <div className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="label">Título</label>
            <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as TipoEventoAgenda)}>
              {Object.entries(tipoLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <button className="btn-primary" onClick={salvarEvento}>
              Salvar compromisso
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              className="btn-secondary px-3 py-1"
              onClick={() => setMesRef(new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1))}
            >
              ←
            </button>
            <div className="font-serif font-medium text-brand-900">
              {mesRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
            <button
              className="btn-secondary px-3 py-1"
              onClick={() => setMesRef(new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1))}
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {diasDoMes.map((d, i) => {
              if (!d) return <div key={i} className="h-20" />
              const key = ymd(d)
              const evs = eventosPorDia[key] ?? []
              const isHoje = key === todayISO()
              return (
                <div
                  key={i}
                  className={`h-20 rounded-lg border p-1 overflow-hidden ${
                    isHoje ? 'border-brand-500 bg-brand-50' : 'border-slate-100'
                  }`}
                >
                  <div className="text-[11px] text-slate-500">{d.getDate()}</div>
                  <div className="space-y-0.5 mt-0.5">
                    {evs.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        title={e.titulo}
                        className={`text-[10px] text-white rounded px-1 truncate ${tipoCor[e.tipo]} ${
                          e.concluido ? 'opacity-40' : ''
                        }`}
                      >
                        {e.titulo}
                      </div>
                    ))}
                    {evs.length > 2 && <div className="text-[10px] text-slate-400">+{evs.length - 2}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-medium text-brand-800 mb-3">Próximos compromissos</h2>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {proximos.map((e) => {
              const cliente = clientes.find((c) => c.id === e.clienteId)
              return (
                <div key={e.id} className="flex items-start gap-2 border-b border-slate-100 pb-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${tipoCor[e.tipo]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{e.titulo}</div>
                    <div className="text-xs text-slate-500">
                      {formatDate(e.data)} · {tipoLabel[e.tipo]}
                      {cliente ? ` · ${cliente.nome}` : ''}
                      {e.valor ? ` · ${formatBRL(e.valor)}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      className="text-[11px] text-brand-600 hover:underline"
                      onClick={() => toggleEventoConcluido(e.id).catch((err) => alert(err instanceof Error ? err.message : 'Erro ao atualizar evento.'))}
                    >
                      Concluir
                    </button>
                    {!e.contratoId && (
                      <button
                        className="text-[11px] text-red-500 hover:underline"
                        onClick={() => removeEvento(e.id).catch((err) => alert(err instanceof Error ? err.message : 'Erro ao remover evento.'))}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {proximos.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Nenhum compromisso pendente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
