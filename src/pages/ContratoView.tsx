import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import { formatBRL, formatDate, todayISO } from '../lib/format'
import type { FormaPagamento } from '../types'

export default function ContratoView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contratos, clientes, assinarContrato, atualizarContrato, excluirContrato } = useStore()
  const { escritorio, atualizarEscritorio: updateEscritorio } = useAuth()
  const contrato = contratos.find((c) => c.id === id)
  const cliente = clientes.find((c) => c.id === contrato?.clienteId)
  const [confirmando, setConfirmando] = useState(false)
  const [editandoEscritorio, setEditandoEscritorio] = useState(false)
  const [editando, setEditando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')

  const [formServico, setFormServico] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formValor, setFormValor] = useState(0)
  const [formTemExito, setFormTemExito] = useState(false)
  const [formPercentualExito, setFormPercentualExito] = useState(0)
  const [formForma, setFormForma] = useState<FormaPagamento>('parcelado')
  const [formNumeroParcelas, setFormNumeroParcelas] = useState(1)
  const [formPrimeiraData, setFormPrimeiraData] = useState(todayISO())
  const [formPoderes, setFormPoderes] = useState('')
  const [formClausulas, setFormClausulas] = useState('')

  useEffect(() => {
    if (!contrato) return
    setFormServico(contrato.servico)
    setFormDescricao(contrato.descricaoServico)
    setFormValor(contrato.valorHonorarios)
    setFormTemExito(contrato.percentualExito != null)
    setFormPercentualExito(contrato.percentualExito ?? 20)
    setFormForma(contrato.formaPagamento)
    setFormNumeroParcelas(contrato.numeroParcelas)
    setFormPrimeiraData(contrato.primeiraParcelaData)
    setFormPoderes(contrato.procuracaoPoderes ?? '')
    setFormClausulas(contrato.clausulasAdicionais ?? '')
  }, [contrato?.id])

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

  const qualificacaoEscritorio = `${escritorio.nomeEscritorio}, inscrito(a) no CNPJ/CPF sob o nº ${escritorio.cpfCnpj}, com escritório profissional em ${escritorio.endereco}, neste ato representado(a) por ${escritorio.nomeAdvogadoResponsavel}, advogado(a) inscrito(a) na OAB/${escritorio.oabUf} sob o nº ${escritorio.oabNumero}`

  const temDadosBancarios = Boolean(escritorio.banco || escritorio.agencia || escritorio.conta || escritorio.pix)

  async function salvarEdicao() {
    setErroEdicao('')
    setSalvandoEdicao(true)
    try {
      await atualizarContrato(contrato!.id, {
        servico: formServico,
        descricaoServico: formDescricao,
        valorHonorarios: formValor,
        percentualExito: formTemExito ? formPercentualExito : undefined,
        formaPagamento: formForma,
        numeroParcelas: formForma === 'avista' ? 1 : formNumeroParcelas,
        primeiraParcelaData: formPrimeiraData,
        procuracaoPoderes: formPoderes,
        clausulasAdicionais: formClausulas || undefined,
      })
      setEditando(false)
    } catch (err) {
      setErroEdicao(err instanceof Error ? err.message : 'Erro ao salvar alterações.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function confirmarExclusao() {
    try {
      await excluirContrato(contrato!.id)
      navigate('/contratos')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir contrato.')
    }
  }

  let numeroClausula = 0
  const proximaClausula = () => `${++numeroClausula}ª`

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/contratos" className="text-xs text-brand-600 hover:underline">
            ← Voltar para Contratos
          </Link>
          <h1 className="text-2xl font-serif font-semibold text-brand-900">Contrato de honorários</h1>
          <p className="text-sm text-slate-500">
            Cliente: {cliente.nome} · Status:{' '}
            <span className={contrato.assinado ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
              {contrato.assinado ? 'Assinado' : 'Rascunho / Aguardando assinatura'}
            </span>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <button className="btn-secondary" onClick={() => setEditandoEscritorio((v) => !v)}>
            Dados do escritório
          </button>
          {!contrato.assinado && (
            <button
              className="btn-secondary"
              onClick={() => {
                setEditando((v) => !v)
                setErroEdicao('')
              }}
            >
              {editando ? 'Fechar edição' : 'Editar contrato'}
            </button>
          )}
          <button className="btn-secondary" onClick={() => window.print()}>
            Imprimir / salvar PDF
          </button>
          {excluindo ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-700">Excluir este contrato definitivamente?</span>
              <button className="btn-secondary bg-red-600 text-white border-red-600 hover:bg-red-700" onClick={confirmarExclusao}>
                Sim, excluir
              </button>
              <button className="btn-secondary" onClick={() => setExcluindo(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button className="text-xs text-red-600 hover:underline" onClick={() => setExcluindo(true)}>
              Excluir contrato
            </button>
          )}
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
              <button className="btn-gold" onClick={() => setConfirmando(true)}>
                Confirmar assinatura do cliente
              </button>
            ))}
        </div>
      </div>

      {contrato.assinado && (
        <div className="no-print text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-3 py-2">
          Este contrato já está assinado. Os dados do serviço, valor e parcelas não podem mais ser editados —
          isso preserva a consistência do financeiro e da agenda já gerados. Você ainda pode excluí-lo, se
          necessário (isso também remove os lançamentos e eventos vinculados a ele).
        </div>
      )}

      {editando && !contrato.assinado && (
        <div className="no-print card p-5 space-y-4">
          <h2 className="font-medium text-brand-800">Editar dados do contrato</h2>
          <div>
            <label className="label">Serviço</label>
            <input className="input" value={formServico} onChange={(e) => setFormServico(e.target.value)} />
          </div>
          <div>
            <label className="label">Descrição do serviço</label>
            <textarea
              className="input"
              rows={3}
              value={formDescricao}
              onChange={(e) => setFormDescricao(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Valor dos honorários (R$)</label>
              <input
                type="number"
                className="input"
                value={formValor}
                onChange={(e) => setFormValor(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Forma de pagamento</label>
              <select
                className="input"
                value={formForma}
                onChange={(e) => setFormForma(e.target.value as FormaPagamento)}
              >
                <option value="avista">À vista</option>
                <option value="parcelado">Parcelado</option>
                <option value="mensal_continuado">Mensalidade (assessoria continuada)</option>
              </select>
            </div>
            {formForma !== 'avista' && (
              <div>
                <label className="label">Número de parcelas</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={formNumeroParcelas}
                  onChange={(e) => setFormNumeroParcelas(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          <div className="max-w-xs">
            <label className="label">Data da 1ª parcela</label>
            <input
              type="date"
              className="input"
              value={formPrimeiraData}
              onChange={(e) => setFormPrimeiraData(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formTemExito}
                onChange={(e) => setFormTemExito(e.target.checked)}
              />
              Haverá honorários contratuais de êxito ao final da demanda
            </label>
            {formTemExito && (
              <div className="max-w-xs mt-2">
                <label className="label">Percentual sobre o proveito econômico obtido (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="input"
                  value={formPercentualExito}
                  onChange={(e) => setFormPercentualExito(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          <div>
            <label className="label">Disposições adicionais (opcional)</label>
            <textarea
              className="input"
              rows={2}
              value={formClausulas}
              onChange={(e) => setFormClausulas(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Poderes da procuração</label>
            <textarea className="input" rows={4} value={formPoderes} onChange={(e) => setFormPoderes(e.target.value)} />
          </div>
          {erroEdicao && <p className="text-sm text-red-600">{erroEdicao}</p>}
          <div className="flex gap-3">
            <button className="btn-primary" disabled={salvandoEdicao} onClick={salvarEdicao}>
              {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button className="btn-secondary" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

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
          <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-1">
            <p className="text-xs font-medium text-slate-500 mb-3">
              Dados bancários (exibidos no contrato de honorários, quando preenchidos)
            </p>
          </div>
          <div>
            <label className="label">Banco</label>
            <input
              className="input"
              value={escritorio.banco ?? ''}
              onChange={(e) => updateEscritorio({ banco: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Agência</label>
            <input
              className="input"
              value={escritorio.agencia ?? ''}
              onChange={(e) => updateEscritorio({ agencia: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Conta corrente</label>
            <input
              className="input"
              value={escritorio.conta ?? ''}
              onChange={(e) => updateEscritorio({ conta: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Chave PIX</label>
            <input
              className="input"
              value={escritorio.pix ?? ''}
              onChange={(e) => updateEscritorio({ pix: e.target.value })}
            />
          </div>
        </div>
      )}

      <div id="print-area" className="card p-10 font-doc text-[13px] leading-relaxed text-slate-800 space-y-6">
        <section>
          <h2 className="text-center font-serif font-semibold text-base uppercase mb-4">
            Contrato de Honorários Advocatícios
          </h2>
          <p>
            <strong>CONTRATANTE:</strong> {qualificacaoCliente}.
          </p>
          <p className="mt-2">
            <strong>CONTRATADO(A):</strong> {qualificacaoEscritorio}.
          </p>
          <p className="mt-2">
            As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Honorários
            Advocatícios, que se regerá pelas condições descritas no presente e pela legislação aplicável, em
            especial a Lei nº 8.906/94 (Estatuto da OAB) e o Código de Ética e Disciplina da OAB.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">DO OBJETO DO CONTRATO</h3>
          <p>
            Cláusula {proximaClausula()}. Prestação de serviço técnico profissional especializado em:{' '}
            <strong>{contrato.servico}</strong>.
          </p>
          <p className="mt-1">{contrato.descricaoServico}</p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">DAS DESPESAS</h3>
          <p>
            Cláusula {proximaClausula()}. Todas as despesas efetuadas pelo(a) CONTRATADO(A), ligadas direta ou
            indiretamente à prestação do serviço, incluindo-se fotocópias, deslocamentos e demais despesas
            operacionais, ficarão a cargo do(a) CONTRATADO(A), excetuando-se impostos, taxas, custas processuais
            e emolumentos cartorários, que correrão por conta do(a) CONTRATANTE.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">DA COBRANÇA</h3>
          <p>
            Cláusula {proximaClausula()}. As partes acordam que é facultado ao(à) CONTRATADO(A) o direito de
            realizar a cobrança dos honorários ora pactuados por todos os meios admitidos em direito.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">DO TEMPO DE CONTRATAÇÃO E DOS HONORÁRIOS</h3>
          <p>
            Cláusula {proximaClausula()}. O presente contrato vigorará a partir da data de sua assinatura até o
            integral cumprimento das obrigações aqui pactuadas.
          </p>
          <p className="mt-2">
            Cláusula {proximaClausula()}. Pelos serviços ora contratados, o(a) CONTRATANTE pagará ao(à)
            CONTRATADO(A) o valor total de <strong>{formatBRL(contrato.valorHonorarios)}</strong>, na forma de{' '}
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
          {temDadosBancarios && (
            <p className="mt-2">
              Parágrafo único. Os valores deverão ser pagos mediante crédito bancário na seguinte conta:{' '}
              {[
                escritorio.banco,
                escritorio.conta && `Conta Corrente ${escritorio.conta}`,
                escritorio.agencia && `Agência ${escritorio.agencia}`,
                escritorio.pix && `PIX chave ${escritorio.pix}`,
              ]
                .filter(Boolean)
                .join(', ')}
              , de titularidade do(a) CONTRATADO(A).
            </p>
          )}
          {contrato.percentualExito != null && (
            <p className="mt-2">
              Cláusula {proximaClausula()}. Além dos honorários fixados na cláusula anterior, o(a)
              CONTRATADO(A) fará jus a honorários contratuais de êxito no percentual de{' '}
              <strong>{contrato.percentualExito}%</strong> sobre o proveito econômico obtido ao final da
              demanda, a serem pagos quando do recebimento dos respectivos valores pelo(a) CONTRATANTE.
            </p>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-1">DA RESCISÃO</h3>
          <p>
            Cláusula {proximaClausula()}. As partes poderão, de comum acordo ou não, rescindir, a qualquer
            tempo, o presente contrato, sem pagamento de qualquer multa contratual, respeitando comunicação
            prévia de 30 (trinta) dias.
          </p>
          <p className="mt-2">
            Parágrafo único. Em caso de rescisão, ficam assegurados ao(à) CONTRATADO(A) os honorários
            proporcionais aos serviços já prestados até o momento do término da prestação dos serviços.
          </p>
        </section>

        {contrato.clausulasAdicionais && (
          <section>
            <h3 className="font-semibold mb-1">DISPOSIÇÕES ADICIONAIS</h3>
            <p>Cláusula {proximaClausula()}. {contrato.clausulasAdicionais}</p>
          </section>
        )}

        <section>
          <h3 className="font-semibold mb-1">DAS DISPOSIÇÕES GERAIS</h3>
          <p>
            Cláusula {proximaClausula()}. Este contrato enquadra-se no rol dos títulos executivos
            extrajudiciais, nos termos do art. 784, inciso XII, do Código de Processo Civil, combinado com o
            art. 24 da Lei nº 8.906/94 (Estatuto da OAB). Em caso de atraso no pagamento, incidirão juros de
            mora à razão de 1% (um por cento) ao mês.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">DA COMUNICAÇÃO</h3>
          <p>
            Cláusula {proximaClausula()}. O(A) CONTRATANTE compromete-se a manter atualizados os meios de
            contato informados neste instrumento, comunicando imediata e inequivocamente ao(à) CONTRATADO(A)
            qualquer alteração de endereço, telefone ou e-mail.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-1">DO FORO</h3>
          <p>
            Cláusula {proximaClausula()}. Para dirimir quaisquer controvérsias oriundas deste contrato, as
            partes elegem o foro da comarca de {cliente.cidade}/{cliente.uf}, renunciando a qualquer outro, por
            mais privilegiado que seja.
          </p>
        </section>

        <section className="pt-8">
          <p>
            Por estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor.
          </p>
          <p className="mt-4">
            {cliente.cidade}/{cliente.uf}, {formatDate(contrato.dataAssinatura || todayISO())}.
          </p>
          <div className="grid grid-cols-1 gap-10 mt-12 text-center">
            <div>
              <div className="font-semibold">{cliente.nome}</div>
              <div className="text-xs text-slate-500 mt-1">Contratante</div>
            </div>
            <div>
              <div className="font-semibold">{escritorio.nomeEscritorio}</div>
              <div className="text-xs text-slate-500 mt-1">Contratada</div>
            </div>
          </div>
          {contrato.assinado && (
            <div className="mt-6 text-center text-xs text-green-700 border border-green-200 bg-green-50 rounded-lg py-2">
              Assinatura do(a) cliente confirmada digitalmente no sistema em{' '}
              {formatDate(contrato.dataAssinatura!)}.
            </div>
          )}
        </section>

        <section className="quebra-pagina pt-10 border-t border-dashed border-slate-300 mt-10">
          <h2 className="text-center font-serif font-semibold text-base uppercase mb-4">
            Instrumento de Procuração Particular
          </h2>
          <p>
            <strong>OUTORGANTE:</strong>
          </p>
          <p className="mt-1">{qualificacaoCliente}.</p>
          <p className="mt-3">
            <strong>OUTORGADO(A):</strong>
          </p>
          <p className="mt-1">{qualificacaoEscritorio}.</p>
          <p className="mt-3">
            <strong>PODERES:</strong>
          </p>
          <p className="mt-1">{contrato.procuracaoPoderes}</p>
          <p className="mt-4">
            {cliente.cidade}/{cliente.uf}, {formatDate(contrato.dataAssinatura || todayISO())}.
          </p>
          <div className="mt-12 text-center">
            <div className="font-semibold">{cliente.nome}</div>
            <div className="text-xs text-slate-500 mt-1">Outorgante</div>
          </div>
        </section>
      </div>
    </div>
  )
}
