import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch, ApiError } from '../api/client'
import { formatDate } from '../lib/format'
import { emTrialValido } from '../lib/plano'

export default function Assinatura() {
  const { escritorio } = useAuth()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const planoStatus = escritorio?.planoStatus || 'trial'
  const trialAte = escritorio?.trialAte
  const trialValido = !!escritorio && emTrialValido(escritorio)
  const trialExpirado = planoStatus === 'trial' && !!trialAte && !trialValido
  const semTrial = planoStatus === 'trial' && !trialAte
  const emDia = planoStatus === 'ativo' || trialValido

  async function comprar() {
    setCarregando(true)
    setErro('')
    try {
      const { invoiceUrl } = await apiFetch<{ invoiceUrl: string }>('/api/assinatura/checkout', { method: 'POST' })
      window.location.href = invoiceUrl
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível gerar a cobrança no momento. Tente novamente em instantes.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-serif font-semibold text-brand-900">Acesso ao sistema</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie a liberação de acesso ao sistema para o seu escritório.</p>
      </header>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Status atual</div>
            <div className="text-lg font-medium text-slate-800">
              {planoStatus === 'ativo' && 'Acesso liberado'}
              {planoStatus === 'trial' && trialValido && 'Período de teste gratuito'}
              {planoStatus === 'trial' && trialExpirado && 'Período de teste encerrado'}
              {semTrial && 'Nenhum acesso ativo'}
              {planoStatus === 'inadimplente' && 'Pagamento pendente'}
              {planoStatus === 'cancelado' && 'Acesso não liberado'}
            </div>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full border ${
              emDia ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {emDia ? 'Em dia' : 'Ação necessária'}
          </span>
        </div>

        {planoStatus === 'trial' && trialAte && (
          <p className="text-sm text-slate-500">
            {trialExpirado
              ? `Seu período de teste terminou em ${formatDate(trialAte)}.`
              : `Seu período de teste vai até ${formatDate(trialAte)}.`}
          </p>
        )}

        {planoStatus !== 'ativo' && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-sm text-slate-600 mb-3">
              Adquira o acesso ao sistema com uma compra única de <strong>R$ 19,90</strong> (pagamento via Pix) e
              continue utilizando a calculadora de honorários, contratos, financeiro e agenda sem limitações — sem
              mensalidade.
            </p>
            <button onClick={comprar} disabled={carregando} className="btn-primary">
              {carregando ? 'Gerando cobrança...' : 'Comprar acesso — R$ 19,90'}
            </button>
            {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}
          </div>
        )}

        {planoStatus === 'ativo' && (
          <p className="text-sm text-slate-500 pt-2 border-t border-slate-100">
            Seu acesso está liberado. Em caso de dúvidas sobre a compra, entre em contato com o suporte.
          </p>
        )}
      </div>
    </div>
  )
}
