import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { formatBRL, formatDate, todayISO } from '../lib/format'
import type { StatusLancamento } from '../types'
import Visto from '../components/Visto'

function statusAtual(status: StatusLancamento, vencimento: string): StatusLancamento {
  if (status !== 'previsto') return status
  return vencimento < todayISO() ? 'atrasado' : 'previsto'
}

const badge: Record<StatusLancamento, string> = {
  previsto: 'bg-blue-50 text-blue-700 border-blue-200',
  recebido: 'bg-green-50 text-green-700 border-green-200',
  atrasado: 'bg-red-50 text-red-700 border-red-200',
  cancelado: 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function Financeiro() {
  const { lancamentos, clientes, contratos, marcarParcelaRecebida } = useStore()
  const [filtro, setFiltro] = useState<'todos' | StatusLancamento>('todos')

  const linhas = useMemo(
    () =>
      lancamentos
        .map((l) => ({ ...l, statusAtual: statusAtual(l.status, l.dataVencimento) }))
        .filter((l) => filtro === 'todos' || l.statusAtual === filtro)
        .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)),
    [lancamentos, filtro],
  )

  const totais = useMemo(() => {
    const base = lancamentos.map((l) => ({ ...l, statusAtual: statusAtual(l.status, l.dataVencimento) }))
    return {
      previsto: base.filter((l) => l.statusAtual === 'previsto').reduce((s, l) => s + l.valor, 0),
      recebido: base.filter((l) => l.statusAtual === 'recebido').reduce((s, l) => s + l.valor, 0),
      atrasado: base.filter((l) => l.statusAtual === 'atrasado').reduce((s, l) => s + l.valor, 0),
    }
  }, [lancamentos])

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-serif font-semibold text-brand-900">Financeiro</h1>
        <p className="text-slate-500 text-sm mt-1">
          Previsibilidade de recebimentos gerada automaticamente a partir dos contratos de honorários
          assinados.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs text-slate-500">A receber (previsto)</div>
          <div className="text-2xl font-serif font-semibold text-brand-800 mt-1">
            {formatBRL(totais.previsto)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-500">Recebido</div>
          <div className="text-2xl font-serif font-semibold text-green-700 mt-1">
            {formatBRL(totais.recebido)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-500">Em atraso</div>
          <div className="text-2xl font-serif font-semibold text-red-600 mt-1">
            {formatBRL(totais.atrasado)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          {(['todos', 'previsto', 'atrasado', 'recebido'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                filtro === f ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-300 text-slate-600'
              }`}
            >
              {f === 'todos' ? 'Todos' : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 bg-slate-50">
            <tr>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Descrição</th>
              <th className="px-4 py-2 font-medium">Vencimento</th>
              <th className="px-4 py-2 font-medium">Valor</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const cliente = clientes.find((c) => c.id === l.clienteId)
              const contrato = contratos.find((c) => c.id === l.contratoId)
              return (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-700">{cliente?.nome ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {l.descricao}
                    {contrato && <span className="text-slate-400"> · {contrato.uf}</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{formatDate(l.dataVencimento)}</td>
                  <td className="px-4 py-2 text-slate-700 font-medium">{formatBRL(l.valor)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${
                        badge[l.statusAtual]
                      }`}
                    >
                      {l.statusAtual === 'recebido' && <Visto height={7} />}
                      {l.statusAtual}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {l.statusAtual !== 'recebido' && l.statusAtual !== 'cancelado' && (
                      <button
                        className="text-brand-600 hover:underline text-xs"
                        onClick={() =>
                          marcarParcelaRecebida(l.id, todayISO()).catch((err) =>
                            alert(err instanceof Error ? err.message : 'Erro ao marcar como recebido.'),
                          )
                        }
                      >
                        Marcar como recebido
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhum lançamento encontrado. Os lançamentos são criados automaticamente quando um contrato
                  de honorários é assinado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
