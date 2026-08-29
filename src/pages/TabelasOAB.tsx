import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useStore } from '../store/useStore'
import { UFS } from '../data/ufs'
import type { ItemTabelaHonorarios, TipoValorHonorario } from '../types'

const tipoLabel: Record<TipoValorHonorario, string> = {
  fixo: 'Valor fixo (R$)',
  percentual_valor_causa: '% sobre valor da causa',
  percentual_exito: '% de êxito (proveito econômico)',
  hora: 'Valor mensal/hora',
}

export default function TabelasOAB() {
  const { tabelasOAB, updateTabelaOAB } = useStore()
  const [uf, setUf] = useState('SP')
  const tabela = tabelasOAB[uf]

  function tratarErro(err: unknown) {
    alert(err instanceof Error ? err.message : 'Erro ao salvar tabela.')
  }

  function atualizarItem(item: ItemTabelaHonorarios) {
    updateTabelaOAB(uf, {
      ...tabela,
      itens: tabela.itens.map((i) => (i.id === item.id ? item : i)),
    }).catch(tratarErro)
  }

  function removerItem(id: string) {
    updateTabelaOAB(uf, { ...tabela, itens: tabela.itens.filter((i) => i.id !== id) }).catch(tratarErro)
  }

  function adicionarItem() {
    updateTabelaOAB(uf, {
      ...tabela,
      itens: [
        ...tabela.itens,
        { id: uuid(), categoria: 'Novo serviço', tipo: 'fixo', valorMin: 0, valorMax: 0 },
      ],
    }).catch(tratarErro)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-serif font-semibold text-brand-900">Tabelas de honorários por OAB</h1>
        <p className="text-slate-500 text-sm mt-1">
          Cada seccional publica sua própria tabela de honorários mínimos recomendados. Selecione o estado e
          confira/ajuste os valores usados como referência na calculadora.
        </p>
      </header>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Seccional</label>
            <select className="input" value={uf} onChange={(e) => setUf(e.target.value)}>
              {UFS.map((u) => (
                <option key={u.sigla} value={u.sigla}>
                  {u.seccional} — {u.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vigência</label>
            <input
              className="input"
              value={tabela.vigencia}
              onChange={(e) => updateTabelaOAB(uf, { ...tabela, vigencia: e.target.value })}
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="label">Fonte / URL oficial</label>
            <input
              className="input"
              placeholder="https://..."
              value={tabela.fonteUrl ?? ''}
              onChange={(e) => updateTabelaOAB(uf, { ...tabela, fonteUrl: e.target.value })}
            />
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full border h-fit ${
              tabela.statusDados === 'pesquisado'
                ? 'bg-green-50 text-green-700 border-green-200'
                : tabela.statusDados === 'parcial'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {tabela.statusDados === 'pesquisado'
              ? 'Conferido com fonte oficial'
              : tabela.statusDados === 'parcial'
              ? 'Parcialmente conferido'
              : 'Genérico — a confirmar'}
          </span>
        </div>

        {tabela.statusDados === 'generico' && (
          <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
            Os valores desta seccional ainda são uma estimativa interna de referência e não foram conferidos
            com o texto oficial vigente da tabela de honorários da {tabela.nomeSeccional}. Edite os itens
            abaixo com os valores oficiais publicados pela seccional (normalmente disponíveis no site da OAB
            estadual) e marque a fonte acima.
          </div>
        )}
        {tabela.statusDados === 'parcial' && (
          <div className="text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-3 py-2">
            Alguns itens abaixo foram conferidos com a fonte oficial indicada; os demais (marcados na
            observação como "valor genérico interno") ainda precisam ser conferidos e ajustados.
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="text-left text-slate-500 bg-slate-50">
            <tr>
              <th className="px-3 py-2 font-medium min-w-[220px]">Categoria de serviço</th>
              <th className="px-3 py-2 font-medium min-w-[180px]">Tipo</th>
              <th className="px-3 py-2 font-medium">Mín.</th>
              <th className="px-3 py-2 font-medium">Máx.</th>
              <th className="px-3 py-2 font-medium min-w-[220px]">Observação</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tabela.itens.map((item) => {
              const percentual = item.tipo === 'percentual_valor_causa' || item.tipo === 'percentual_exito'
              return (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 w-1/4">
                    <input
                      className="input"
                      value={item.categoria}
                      onChange={(e) => atualizarItem({ ...item, categoria: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="input"
                      value={item.tipo}
                      onChange={(e) => atualizarItem({ ...item, tipo: e.target.value as TipoValorHonorario })}
                    >
                      {Object.entries(tipoLabel).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 w-32">
                    <input
                      type="number"
                      className="input"
                      value={percentual ? item.percMin ?? 0 : item.valorMin ?? 0}
                      onChange={(e) =>
                        atualizarItem(
                          percentual
                            ? { ...item, percMin: Number(e.target.value) }
                            : { ...item, valorMin: Number(e.target.value) },
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2 w-32">
                    <input
                      type="number"
                      className="input"
                      value={percentual ? item.percMax ?? 0 : item.valorMax ?? 0}
                      onChange={(e) =>
                        atualizarItem(
                          percentual
                            ? { ...item, percMax: Number(e.target.value) }
                            : { ...item, valorMax: Number(e.target.value) },
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="input"
                      value={item.observacao ?? ''}
                      onChange={(e) => atualizarItem({ ...item, observacao: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-red-500 text-xs hover:underline" onClick={() => removerItem(item.id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="p-4">
          <button className="btn-secondary" onClick={adicionarItem}>
            + Adicionar item
          </button>
        </div>
      </div>
    </div>
  )
}
