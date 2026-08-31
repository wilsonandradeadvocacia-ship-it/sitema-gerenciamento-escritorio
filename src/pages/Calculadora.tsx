import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { UFS } from '../data/ufs'
import { formatBRL, todayISO } from '../lib/format'
import type { FormaPagamento, ItemTabelaHonorarios } from '../types'

const PODERES_PADRAO =
  'poderes gerais para o foro (ad judicia), em conformidade com o art. 105 do CPC, podendo propor ' +
  'ação e contestá-la, transigir, desistir, renunciar ao direito sobre o qual se funda a ação, receber e dar ' +
  'quitação, firmar compromisso e receber intimações, podendo ainda substabelecer, com ou sem reserva de ' +
  'poderes, esta procuração, em uma ou mais pessoas, na forma da lei, especificamente para atuar em favor ' +
  'do(a) outorgante em relação ao serviço descrito no contrato de honorários correspondente.'

export default function Calculadora() {
  const navigate = useNavigate()
  const { clientes, tabelasOAB, criarContrato } = useStore()

  const [clienteId, setClienteId] = useState('')
  const [uf, setUf] = useState('SP')
  const [itemId, setItemId] = useState('')
  const [origemValor, setOrigemValor] = useState<'tabela_oab' | 'manual'>('tabela_oab')
  const [valorCausa, setValorCausa] = useState<number>(0)
  const [valorManual, setValorManual] = useState<number>(0)
  const [descricaoServico, setDescricaoServico] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('parcelado')
  const [numeroParcelas, setNumeroParcelas] = useState(3)
  const [primeiraParcelaData, setPrimeiraParcelaData] = useState(todayISO())
  const [poderes, setPoderes] = useState(PODERES_PADRAO)
  const [valorEscolhido, setValorEscolhido] = useState<number | null>(null)

  const tabela = tabelasOAB[uf]
  const item: ItemTabelaHonorarios | undefined = tabela?.itens.find((i) => i.id === itemId)

  const faixaSugerida = useMemo(() => {
    if (!item) return null
    if (item.tipo === 'percentual_valor_causa' || item.tipo === 'percentual_exito') {
      const base = valorCausa || 0
      const min = Math.max(((item.percMin ?? 0) / 100) * base, item.valorMin ?? 0)
      const max = ((item.percMax ?? 0) / 100) * base
      return { min, max: Math.max(max, min) }
    }
    return { min: item.valorMin ?? 0, max: item.valorMax ?? item.valorMin ?? 0 }
  }, [item, valorCausa])

  const valorFinal =
    origemValor === 'manual' ? valorManual : valorEscolhido ?? faixaSugerida?.min ?? 0

  const clienteSelecionado = clientes.find((c) => c.id === clienteId)

  async function gerarContrato() {
    if (!clienteId || !descricaoServico.trim() || valorFinal <= 0) return
    const servicoNome = item ? item.categoria : 'Serviço advocatício (honorários definidos manualmente)'
    try {
      const contrato = await criarContrato({
        clienteId,
        uf,
        servico: servicoNome,
        descricaoServico,
        origemValor,
        itemTabelaId: item?.id,
        valorHonorarios: valorFinal,
        formaPagamento,
        numeroParcelas: formaPagamento === 'avista' ? 1 : numeroParcelas,
        primeiraParcelaData,
        procuracaoPoderes: poderes,
      })
      navigate(`/contratos/${contrato.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar contrato.')
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-serif font-semibold text-brand-900">Calculadora de honorários</h1>
        <p className="text-slate-500 text-sm mt-1">
          Escolha a OAB do estado, o serviço prestado e defina o valor de honorários — usando a tabela como
          referência ou de forma manual.
        </p>
      </header>

      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-brand-800">1. Cliente e OAB de referência</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Cliente</label>
            <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Selecione um cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            {clientes.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Nenhum cliente cadastrado — cadastre um em "Clientes" antes de gerar o contrato.
              </p>
            )}
          </div>
          <div>
            <label className="label">OAB do estado (tabela de referência)</label>
            <select
              className="input"
              value={uf}
              onChange={(e) => {
                setUf(e.target.value)
                setItemId('')
                setValorEscolhido(null)
              }}
            >
              {UFS.map((u) => (
                <option key={u.sigla} value={u.sigla}>
                  {u.seccional} — {u.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        {tabela?.statusDados === 'generico' && (
          <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
            Esta seccional ainda está com a <strong>tabela genérica de referência interna</strong> (não
            conferida com o texto oficial vigente). Confira e ajuste os valores em "Tabelas OAB" antes de
            adotá-los oficialmente.
          </div>
        )}
        {tabela?.statusDados === 'parcial' && (
          <div className="text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-3 py-2">
            Parte dos itens desta seccional foi conferida em fonte oficial ({tabela.fonteUrl ? 'ver link em "Tabelas OAB"' : 'ver "Tabelas OAB"'}); os
            demais itens ainda usam valores genéricos internos, sinalizados na observação de cada item. Revise
            antes de adotar oficialmente.
          </div>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-brand-800">2. Serviço prestado e valor</h2>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={origemValor === 'tabela_oab'}
              onChange={() => setOrigemValor('tabela_oab')}
            />
            Usar parâmetro da tabela {tabela?.nomeSeccional}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={origemValor === 'manual'} onChange={() => setOrigemValor('manual')} />
            Definir valor manualmente
          </label>
        </div>

        {origemValor === 'tabela_oab' && (
          <div className="space-y-4">
            <div>
              <label className="label">Tipo de serviço</label>
              <select
                className="input"
                value={itemId}
                onChange={(e) => {
                  setItemId(e.target.value)
                  setValorEscolhido(null)
                }}
              >
                <option value="">Selecione o serviço...</option>
                {tabela?.itens.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.categoria}
                  </option>
                ))}
              </select>
            </div>

            {item && (item.tipo === 'percentual_valor_causa' || item.tipo === 'percentual_exito') && (
              <div>
                <label className="label">Valor da causa / proveito econômico (R$)</label>
                <input
                  type="number"
                  className="input"
                  value={valorCausa || ''}
                  onChange={(e) => setValorCausa(Number(e.target.value))}
                />
              </div>
            )}

            {item && faixaSugerida && (
              <div className="bg-brand-50 border border-brand-100 rounded-lg p-4">
                <div className="text-sm text-brand-800 font-medium mb-1">
                  Faixa sugerida pela tabela ({tabela.nomeSeccional}
                  {tabela.vigencia !== 'não verificada' ? ` · vigência ${tabela.vigencia}` : ''})
                </div>
                <div className="text-sm text-slate-600 mb-2">
                  {item.tipo === 'percentual_valor_causa' || item.tipo === 'percentual_exito'
                    ? `${item.percMin}% a ${item.percMax}% ${
                        item.tipo === 'percentual_exito' ? 'sobre o proveito econômico' : 'sobre o valor da causa'
                      }`
                    : 'Valor fixo de referência'}
                </div>
                <div className="text-lg font-serif text-brand-900 mb-3">
                  Mínimo <strong>{formatBRL(faixaSugerida.min)}</strong> — Máximo{' '}
                  <strong>{formatBRL(faixaSugerida.max)}</strong>
                </div>
                <label className="label">Valor de honorários a adotar</label>
                <input
                  type="range"
                  min={faixaSugerida.min}
                  max={Math.max(faixaSugerida.max, faixaSugerida.min + 1)}
                  step={1}
                  value={valorEscolhido ?? faixaSugerida.min}
                  onChange={(e) => setValorEscolhido(Number(e.target.value))}
                  className="w-full"
                />
                <input
                  type="number"
                  className="input mt-2"
                  value={valorEscolhido ?? faixaSugerida.min}
                  onChange={(e) => setValorEscolhido(Number(e.target.value))}
                />
                {item.observacao && <p className="text-xs text-slate-500 mt-2">{item.observacao}</p>}
              </div>
            )}
          </div>
        )}

        {origemValor === 'manual' && (
          <div>
            <label className="label">Valor dos honorários (R$)</label>
            <input
              type="number"
              className="input"
              value={valorManual || ''}
              onChange={(e) => setValorManual(Number(e.target.value))}
            />
          </div>
        )}

        <div>
          <label className="label">Descrição do serviço a ser prestado</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Ex.: Ajuizamento e acompanhamento de ação de cobrança em face de..."
            value={descricaoServico}
            onChange={(e) => setDescricaoServico(e.target.value)}
          />
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-brand-800">3. Forma de pagamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Forma</label>
            <select
              className="input"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
            >
              <option value="avista">À vista</option>
              <option value="parcelado">Parcelado</option>
              <option value="mensal_continuado">Mensalidade (assessoria continuada)</option>
            </select>
          </div>
          {formaPagamento !== 'avista' && (
            <div>
              <label className="label">Número de parcelas</label>
              <input
                type="number"
                min={1}
                className="input"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(Number(e.target.value))}
              />
            </div>
          )}
          <div>
            <label className="label">Data da 1ª parcela</label>
            <input
              type="date"
              className="input"
              value={primeiraParcelaData}
              onChange={(e) => setPrimeiraParcelaData(e.target.value)}
            />
          </div>
        </div>
        <div className="text-sm text-slate-600">
          Valor total dos honorários: <strong className="text-brand-900">{formatBRL(valorFinal)}</strong>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-brand-800">4. Poderes da procuração</h2>
        <textarea className="input" rows={4} value={poderes} onChange={(e) => setPoderes(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <button
          className="btn-caneta px-6 py-3 text-base"
          disabled={!clienteId || !descricaoServico.trim() || valorFinal <= 0}
          onClick={gerarContrato}
        >
          Gerar contrato de honorários e procuração
        </button>
      </div>
      {!clienteSelecionado && clienteId === '' && (
        <p className="text-right text-xs text-slate-400">Selecione um cliente para continuar.</p>
      )}
    </div>
  )
}
