import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatBRL, formatDate, todayISO } from '../lib/format'
import Visto from '../components/Visto'

export default function Dashboard() {
  const { clientes, contratos, lancamentos, eventos } = useStore()

  const contratosAssinados = contratos.filter((c) => c.assinado)
  const contratosRascunho = contratos.filter((c) => !c.assinado && c.status !== 'cancelado')

  const hoje = todayISO()
  const previsto = lancamentos.filter((l) => l.status === 'previsto' && l.dataVencimento >= hoje)
  const atrasado = lancamentos.filter((l) => l.status === 'previsto' && l.dataVencimento < hoje)
  const recebido = lancamentos.filter((l) => l.status === 'recebido')

  const totalPrevisto = previsto.reduce((s, l) => s + l.valor, 0)
  const totalAtrasado = atrasado.reduce((s, l) => s + l.valor, 0)
  const totalRecebido = recebido.reduce((s, l) => s + l.valor, 0)

  const proximosEventos = eventos
    .filter((e) => !e.concluido && e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 6)

  const proximos30dias = lancamentos
    .filter((l) => l.status !== 'recebido' && l.status !== 'cancelado')
    .filter((l) => {
      const dias = (new Date(l.dataVencimento).getTime() - new Date(hoje).getTime()) / 86400000
      return dias >= -3650 && dias <= 30
    })
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 8)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-serif font-semibold text-brand-900">Visão geral</h1>
        <p className="text-slate-500 text-sm mt-1">Resumo do escritório.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Clientes" value={String(clientes.length)} to="/clientes" />
        <StatCard
          label="Contratos assinados"
          value={String(contratosAssinados.length)}
          to="/calculadora"
          tone="caneta"
          marcado={contratosAssinados.length > 0}
        />
        <StatCard label="A receber (previsto)" value={formatBRL(totalPrevisto)} to="/financeiro" tone="brand" />
        <StatCard label="Em atraso" value={formatBRL(totalAtrasado)} to="/financeiro" tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-brand-800">Próximos recebimentos</h2>
            <Link to="/financeiro" className="text-xs text-brand-600 hover:underline">
              ver tudo
            </Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {proximos30dias.map((l) => {
                const cliente = clientes.find((c) => c.id === l.clienteId)
                const atrasada = l.dataVencimento < hoje
                return (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-700">{cliente?.nome ?? '—'}</td>
                    <td className="py-2 text-slate-500">{l.descricao}</td>
                    <td className="py-2 text-slate-500">{formatDate(l.dataVencimento)}</td>
                    <td className={`py-2 text-right font-medium ${atrasada ? 'text-red-600' : 'text-slate-700'}`}>
                      {formatBRL(l.valor)}
                    </td>
                  </tr>
                )
              })}
              {proximos30dias.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Nenhum recebimento previsto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-brand-800">Próxima agenda</h2>
            <Link to="/agenda" className="text-xs text-brand-600 hover:underline">
              ver tudo
            </Link>
          </div>
          <div className="space-y-3">
            {proximosEventos.map((e) => (
              <div key={e.id} className="border-b border-slate-100 pb-2">
                <div className="text-sm font-medium text-slate-700">{e.titulo}</div>
                <div className="text-xs text-slate-500">{formatDate(e.data)}</div>
              </div>
            ))}
            {proximosEventos.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Nada agendado.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-medium text-brand-800 mb-2">Recebido no total</h2>
          <div className="text-2xl font-serif font-semibold text-green-700">{formatBRL(totalRecebido)}</div>
        </div>
        <div className="card p-5">
          <h2 className="font-medium text-brand-800 mb-2">Contratos aguardando assinatura</h2>
          <div className="text-2xl font-serif font-semibold text-amber-600">{contratosRascunho.length}</div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  to,
  tone = 'default',
  marcado = false,
}: {
  label: string
  value: string
  to: string
  tone?: 'default' | 'brand' | 'red' | 'caneta'
  /** Exibe o Visto pousado sob o número — só onde ele significa "resolvido". */
  marcado?: boolean
}) {
  const toneClass =
    tone === 'brand'
      ? 'text-brand-800'
      : tone === 'red'
      ? 'text-red-600'
      : tone === 'caneta'
      ? 'text-caneta-700'
      : 'text-slate-800'
  return (
    <Link to={to} className="card p-5 hover:shadow-md transition-shadow block">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-serif font-semibold mt-1 ${toneClass}`}>{value}</div>
      {marcado && <Visto cut="master" height={11} className="text-caneta-600 mt-2" />}
    </Link>
  )
}
