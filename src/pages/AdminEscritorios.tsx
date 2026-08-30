import { useEffect, useState } from 'react'
import { apiFetch, ApiError } from '../api/client'
import { formatDate } from '../lib/format'

interface EscritorioAdmin {
  id: string
  nomeEscritorio: string
  nomeAdvogadoResponsavel: string
  ativo: boolean
  planoStatus: string
  trialAte: string | null
  dataProximoVencimento: string | null
  createdAt: string
  emailAdmin: string
  totalUsuarios: number
  totalClientes: number
  totalContratos: number
}

const planoLabel: Record<string, string> = {
  trial: 'Período de teste',
  ativo: 'Assinatura ativa',
  inadimplente: 'Inadimplente',
  cancelado: 'Cancelado',
}

const planoBadge: Record<string, string> = {
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  ativo: 'bg-green-50 text-green-700 border-green-200',
  inadimplente: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelado: 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function AdminEscritorios() {
  const [escritorios, setEscritorios] = useState<EscritorioAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const data = await apiFetch<EscritorioAdmin[]>('/api/admin/escritorios')
      setEscritorios(data)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os escritórios.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function atualizar(id: string, patch: Partial<Pick<EscritorioAdmin, 'ativo' | 'planoStatus'>>) {
    setSalvandoId(id)
    try {
      const atualizado = await apiFetch<EscritorioAdmin>(`/api/admin/escritorios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setEscritorios((prev) => prev.map((e) => (e.id === id ? { ...e, ...atualizado } : e)))
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Não foi possível atualizar o escritório.')
    } finally {
      setSalvandoId(null)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-serif font-semibold text-brand-900">Administração da plataforma</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral de todos os escritórios cadastrados no sistema.</p>
      </header>

      {erro && <div className="card p-4 text-sm text-red-600 border-red-200 bg-red-50">{erro}</div>}

      {carregando ? (
        <div className="card p-8 text-center text-slate-400">Carregando...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-left text-slate-500 bg-slate-50">
              <tr>
                <th className="px-4 py-2 font-medium">Escritório</th>
                <th className="px-4 py-2 font-medium">E-mail admin</th>
                <th className="px-4 py-2 font-medium">Clientes</th>
                <th className="px-4 py-2 font-medium">Contratos</th>
                <th className="px-4 py-2 font-medium">Plano</th>
                <th className="px-4 py-2 font-medium">Trial até</th>
                <th className="px-4 py-2 font-medium">Cadastrado em</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {escritorios.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-700">{e.nomeEscritorio}</td>
                  <td className="px-4 py-2 text-slate-600">{e.emailAdmin || '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{e.totalClientes}</td>
                  <td className="px-4 py-2 text-slate-600">{e.totalContratos}</td>
                  <td className="px-4 py-2">
                    <select
                      className="input py-1 text-xs"
                      value={e.planoStatus}
                      disabled={salvandoId === e.id}
                      onChange={(ev) => atualizar(e.id, { planoStatus: ev.target.value })}
                    >
                      {Object.keys(planoLabel).map((p) => (
                        <option key={p} value={p}>
                          {planoLabel[p]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{e.trialAte ? formatDate(e.trialAte) : '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(e.createdAt)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        e.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {e.ativo ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      disabled={salvandoId === e.id}
                      onClick={() => atualizar(e.id, { ativo: !e.ativo })}
                      className="text-xs text-brand-600 hover:underline disabled:opacity-50"
                    >
                      {e.ativo ? 'Bloquear' : 'Desbloquear'}
                    </button>
                  </td>
                </tr>
              ))}
              {escritorios.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    Nenhum escritório cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
