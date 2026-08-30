import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatBRL, formatDate } from '../lib/format'
import type { ContratoHonorarios } from '../types'

type FiltroStatus = 'todos' | 'rascunho' | 'assinado' | 'cancelado'

const statusLabel: Record<ContratoHonorarios['status'], string> = {
  rascunho: 'Aguardando assinatura',
  assinado: 'Assinado',
  cancelado: 'Cancelado',
}

const statusBadge: Record<ContratoHonorarios['status'], string> = {
  rascunho: 'bg-amber-50 text-amber-700 border-amber-200',
  assinado: 'bg-green-50 text-green-700 border-green-200',
  cancelado: 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function Contratos() {
  const { contratos, clientes } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<FiltroStatus>((searchParams.get('status') as FiltroStatus) || 'rascunho')
  const [clienteId, setClienteId] = useState(searchParams.get('clienteId') || '')

  function mudarStatus(novo: FiltroStatus) {
    setStatus(novo)
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      novo === 'todos' ? p.delete('status') : p.set('status', novo)
      return p
    })
  }

  const clientesComContrato = useMemo(() => {
    const ids = new Set(contratos.map((c) => c.clienteId))
    return clientes.filter((c) => ids.has(c.id))
  }, [contratos, clientes])

  const contratosFiltrados = useMemo(() => {
    return contratos
      .filter((c) => status === 'todos' || c.status === status)
      .filter((c) => !clienteId || c.clienteId === clienteId)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }, [contratos, status, clienteId])

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-serif font-semibold text-brand-900">Contratos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Acompanhe os contratos de honorários gerados, filtre por status e por cliente.
        </p>
      </header>

      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {(['rascunho', 'assinado', 'cancelado', 'todos'] as const).map((s) => (
            <button
              key={s}
              onClick={() => mudarStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                status === s ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-300 text-slate-600'
              }`}
            >
              {s === 'todos' ? 'Todos' : statusLabel[s]}
            </button>
          ))}
        </div>
        <div className="ml-auto min-w-[220px]">
          <select
            className="input"
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value)
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                e.target.value ? p.set('clienteId', e.target.value) : p.delete('clienteId')
                return p
              })
            }}
          >
            <option value="">Todos os clientes</option>
            {clientesComContrato.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-slate-500 bg-slate-50">
            <tr>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Serviço</th>
              <th className="px-4 py-2 font-medium">Valor</th>
              <th className="px-4 py-2 font-medium">Criado em</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {contratosFiltrados.map((c) => {
              const cliente = clientes.find((cl) => cl.id === c.clienteId)
              return (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-700">{cliente?.nome ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{c.servico}</td>
                  <td className="px-4 py-2 text-slate-700">{formatBRL(c.valorHonorarios)}</td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(c.criadoEm)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge[c.status]}`}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/contratos/${c.id}`} className="text-brand-600 hover:underline text-xs">
                      Ver / editar
                    </Link>
                  </td>
                </tr>
              )
            })}
            {contratosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Nenhum contrato encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
