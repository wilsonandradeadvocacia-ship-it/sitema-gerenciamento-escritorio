import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import { formatBRL, formatDate, todayISO } from '../lib/format'
import Visto, { RubricaVisto } from '../components/Visto'

export default function ContratoView() {
  const { id } = useParams()
  const { contratos, clientes, assinarContrato } = useStore()
  const { escritorio, atualizarEscritorio: updateEscritorio } = useAuth()
  const contrato = contratos.find((c) => c.id === id)
  const cliente = clientes.find((c) => c.id === contrato?.clienteId)
  const [confirmando, setConfirmando] = useState(false)
  const [editandoEscritorio, setEditandoEscritorio] = useState(false)

  if (!contrato || !cliente || !escritorio) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Contrato não encontrado.</p>
        <Link to="/calculadora" className="text-brand-600 underline">
          Voltar para a calculadora
        </Link>
      </div>
    )
  }

  const qualificacaoCliente =
    cliente.tipo === 'fisica'
      ? `${cliente.nome}, ${cliente.nacionalidade || 'brasileiro(a)'}, ${cliente.estadoCivil || ''}, ${
          cliente.profissaoOuRamo || ''
        }, portador(a) do CPF nº ${cliente.cpfCnpj}, residente e domiciliado(a) em ${cliente.endereco}, ${
          cliente.cidade
        }/${cliente.uf}`
      : `${cliente.nome}, pessoa jurídica inscrita no CNPJ nº ${cliente.cpfCnpj}, com sede em ${cliente.endereco}, ${cliente.cidade}/${cliente.uf}, neste ato representada na forma de seu contrato/estatuto social`

  const qualificacaoEscritorio = `${escritorio.nomeAdvogadoResponsavel}, inscrito(a) na ${escritorio.oabUf > '' ? `OAB/${escritorio.oabUf}` : 'OAB'} sob o nº ${escritorio.oabNumero}, integrante de ${escritorio.nomeEscritorio}, CPF/CNPJ nº ${escritorio.cpfCnpj}, com endereço profissional em ${escritorio.endereco}`

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-900">Contrato de honorários</h1>
          <p className="text-sm text-slate-500">
            Cliente: {cliente.nome} · Status:{' '}
            {contrato.assinado ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-caneta-600">
                <Visto draw title="Assinado" className="text-caneta-600" />
                Assinado
              </span>
            ) : (
              <span className="font-medium text-amber-600">Rascunho / Aguardando assinatura</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => setEditandoEscritorio((v) => !v)}>
            Dados do escritório
          </button>
          <button className="btn-secondary" onClick={() => window.print()}>
            Imprimir / salvar PDF
          </button>
          {!contrato.assinado &&
            (confirmando ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Confirmar assinatura do cliente?</span>
                <button
                  className="btn-primary"
                  onClick={() => {
                    assinarContrato(contrato.id)
                    setConfirmando(false)
                  }}
                >
                  Sim, confirmar
                </button>
                <button className="btn-secondary" onClick={() => setConfirmando(false)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button className="btn-caneta" onClick={() => setConfirmando(true)}>
                Confirmar assinatura do cliente
              </button>
            ))}
        </div>
      </div>

      {editandoEscritorio && (
        <div className="no-print card p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nome do escritório</label>
            <input
              className="input"
              value={escritorio.nomeEscritorio}
              onChange={(e) => updateEscritorio({ nomeEscritorio: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Advogado(a) responsável</label>
            <input
              className="input"
              value={escritorio.nomeAdvogadoResponsavel}
              onChange={(e) => updateEscritorio({ nomeAdvogadoResponsavel: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Nº OAB</label>
            <input
              className="input"
              value={escritorio.oabNumero}
              onChange={(e) => updateEscritorio({ oabNumero: e.target.value })}
            />
          </div>
          <div>
            <label className="label">UF da OAB</label>
            <input
              className="input"
              value={escritorio.oabUf}
              onChange={(e) => updateEscritorio({ oabUf: e.target.value })}
            />
          </div>
          <div>
            <label className="label">CPF/CNPJ</label>
            <input
              className="input"
              value={escritorio.cpfCnpj}
              onChange={(e) => updateEscritorio({ cpfCnpj: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Endereço profissional</label>
            <input
              className="input"
              value={escritorio.endereco}
              onChange={(e) => updateEscritorio({ endereco: e.target.value })}
            />
          </div>
        </div>
      )}

      <div id="print-area" className="card p-10 font-serif text-[13px] leading-relaxed text-slate-800 space-y-6">
        <section>
          <h2 className="text-center font-semibold text-base uppercase mb-4">
            Contrato de Prestação de Serviços Advocatícios e Honorários
          </h2>
          <p>
            <strong>CONTRATANTE:</strong> {qualificacaoCliente}.
          </p>
          <p className="mt-2">
            <strong>CONTRATADO(A):</strong> {qualificacaoEscritorio}.
          </p>
          <p className="mt-2">
            As partes acima identificadas têm, entre si, justo e contratado o presente Contrato de Prestação de
            Serviços Advocatícios, que se regerá pelas cláusulas seguintes e pela legislação aplicável, em
            especial a Lei nº 8.906/94 (Estatuto da OAB) e o Código de Ética e Disciplina da OAB.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">CLÁUSULA 1ª — DO OBJETO</h3>
          <p>
            O(A) CONTRATADO(A) prestará ao(à) CONTRATANTE serviços advocatícios referentes a:{' '}
            <strong>{contrato.servico}</strong>.
          </p>
          <p className="mt-1">{contrato.descricaoServico}</p>
          <p className="mt-1 text-slate-500 text-xs">
            Referência de mercado consultada: tabela de honorários {contrato.uf ? `da ${contrato.uf}` : ''}
            {contrato.origemValor === 'tabela_oab' ? ' (parâmetro adotado como base de cálculo).' : ' (valor definido manualmente entre as partes).'}
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">CLÁUSULA 2ª — DOS HONORÁRIOS</h3>
          <p>
            Pelos serviços ora contratados, o(a) CONTRATANTE pagará ao(à) CONTRATADO(A) o valor total de{' '}
            <strong>{formatBRL(contrato.valorHonorarios)}</strong>, na forma de{' '}
            {contrato.formaPagamento === 'avista'
              ? 'pagamento à vista'
              : contrato.formaPagamento === 'mensal_continuado'
              ? 'mensalidades'
              : 'pagamento parcelado'}
            , conforme cronograma abaixo:
          </p>
          <table className="w-full mt-3 text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-1">Parcela</th>
                <th className="border border-slate-300 px-2 py-1">Descrição</th>
                <th className="border border-slate-300 px-2 py-1">Vencimento</th>
                <th className="border border-slate-300 px-2 py-1">Valor</th>
              </tr>
            </thead>
            <tbody>
              {contrato.parcelas.map((p) => (
                <tr key={p.id}>
                  <td className="border border-slate-300 px-2 py-1 text-center">{p.numero}</td>
                  <td className="border border-slate-300 px-2 py-1">{p.descricao}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{formatDate(p.dataVencimento)}</td>
                  <td className="border border-slate-300 px-2 py-1 text-right">{formatBRL(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">
            Os honorários ora ajustados não incluem custas judiciais, despesas processuais, emolumentos,
            taxas, honorários periciais ou de terceiros, que correrão por conta do(a) CONTRATANTE. Não estão
            aqui incluídos eventuais honorários de sucumbência, que pertencerão ao(à) CONTRATADO(A) nos termos
            do art. 23 da Lei nº 8.906/94.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">CLÁUSULA 3ª — DAS OBRIGAÇÕES DAS PARTES</h3>
          <p>
            O(A) CONTRATADO(A) obriga-se a empregar os melhores esforços técnicos na defesa dos interesses
            do(a) CONTRATANTE, sem garantia de resultado. O(A) CONTRATANTE obriga-se a fornecer, com veracidade
            e tempestividade, todas as informações e documentos necessários ao bom desempenho do serviço
            contratado, bem como a efetuar o pagamento dos honorários nas datas pactuadas.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">CLÁUSULA 4ª — DA RESCISÃO</h3>
          <p>
            O presente contrato poderá ser rescindido por qualquer das partes, mediante comunicação prévia por
            escrito, ficando assegurado ao(à) CONTRATADO(A) o direito aos honorários proporcionais aos serviços
            já prestados até a data da rescisão.
          </p>
        </section>

        {contrato.clausulasAdicionais && (
          <section>
            <h3 className="font-semibold mb-1">CLÁUSULA 5ª — DISPOSIÇÕES ADICIONAIS</h3>
            <p>{contrato.clausulasAdicionais}</p>
          </section>
        )}

        <section>
          <h3 className="font-semibold mb-1">CLÁUSULA FINAL — DO FORO</h3>
          <p>
            Fica eleito o foro da comarca de {cliente.cidade}/{cliente.uf} para dirimir quaisquer dúvidas
            oriundas deste contrato.
          </p>
        </section>

        <section className="pt-8">
          <p>{cliente.cidade}/{cliente.uf}, {formatDate(contrato.dataAssinatura || todayISO())}.</p>
          <div className="grid grid-cols-2 gap-8 mt-10 text-center">
            <div>
              <div className="border-t border-slate-500 pt-2">{cliente.nome}</div>
              <div className="text-xs text-slate-500">CONTRATANTE</div>
            </div>
            <div>
              <div className="border-t border-slate-500 pt-2">{escritorio.nomeAdvogadoResponsavel}</div>
              <div className="text-xs text-slate-500">
                CONTRATADO(A) — OAB/{escritorio.oabUf} {escritorio.oabNumero}
              </div>
            </div>
          </div>
          {contrato.assinado && (
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-caneta-700 border border-caneta-200 bg-caneta-50 rounded-lg py-2 px-3">
              <Visto cut="master" height={12} className="text-caneta-600" />
              <span>
                Assinatura do(a) cliente confirmada digitalmente no sistema em{' '}
                {formatDate(contrato.dataAssinatura!)}.
              </span>
            </div>
          )}
          <div className="flex justify-end pt-8">
            <RubricaVisto etiqueta="CONTRATO GERADO" />
          </div>
        </section>

        <section className="pt-10 border-t border-dashed border-slate-300 mt-10">
          <h2 className="text-center font-semibold text-base uppercase mb-4">Procuração Ad Judicia</h2>
          <p>
            <strong>OUTORGANTE:</strong> {qualificacaoCliente}.
          </p>
          <p className="mt-2">
            <strong>OUTORGADO(A):</strong> {qualificacaoEscritorio}.
          </p>
          <p className="mt-3">
            Pelo presente instrumento particular de mandato, o(a) OUTORGANTE nomeia e constitui seu(sua)
            bastante procurador(a) o(a) OUTORGADO(A) acima qualificado(a), a quem confere{' '}
            {contrato.procuracaoPoderes}
          </p>
          <p className="mt-4">{cliente.cidade}/{cliente.uf}, {formatDate(contrato.dataAssinatura || todayISO())}.</p>
          <div className="mt-10 text-center">
            <div className="border-t border-slate-500 pt-2 inline-block px-16">{cliente.nome}</div>
            <div className="text-xs text-slate-500">OUTORGANTE</div>
          </div>
          <div className="flex justify-end pt-8">
            <RubricaVisto etiqueta="PROCURAÇÃO GERADA" />
          </div>
        </section>
      </div>
    </div>
  )
}
