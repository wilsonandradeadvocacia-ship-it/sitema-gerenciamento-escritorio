import { Link } from 'react-router-dom'

export default function Termos() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <Link to="/login" className="text-sm text-brand-600 hover:underline">
          ← Voltar
        </Link>
        <div className="card p-8 space-y-5 text-sm leading-relaxed text-slate-700">
          <h1 className="text-2xl font-serif font-semibold text-brand-900">Termos de Uso</h1>
          <p className="text-xs text-slate-400">Última atualização: 30 de agosto de 2026.</p>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">1. Sobre o serviço</h2>
            <p>
              Este sistema ("Serviço") é uma ferramenta de apoio à gestão de escritórios de advocacia,
              oferecendo cadastro de clientes, calculadora de honorários com tabelas de referência da OAB,
              geração de contratos e procurações, controle financeiro e agenda. O Serviço é fornecido por
              assinatura, mediante o cadastro de um escritório e a criação de uma conta de acesso.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">2. Natureza da ferramenta — isenção de responsabilidade jurídica</h2>
            <p>
              O Serviço é uma ferramenta de organização e automação de documentos e rotinas administrativas.
              Ele <strong>não presta consultoria jurídica</strong>, não substitui a análise e o julgamento
              profissional do(a) advogado(a) responsável, e os modelos de contrato de honorários e procuração
              gerados são pontos de partida que devem ser revisados pelo(a) próprio(a) advogado(a) antes de
              qualquer uso com clientes. As tabelas de honorários por OAB apresentadas são referências
              internas, com nível de confiabilidade variável (indicado na tela "Tabelas OAB"), e não
              substituem a consulta ao texto oficial vigente publicado pela respectiva seccional.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">3. Cadastro e responsabilidade pela conta</h2>
            <p>
              O escritório contratante é responsável pela veracidade dos dados cadastrados, pela guarda de
              sua senha de acesso e por todas as ações realizadas com seu usuário. Cada conta é destinada a
              um único escritório, cujos dados (clientes, contratos, financeiro e agenda) ficam isolados dos
              demais escritórios cadastrados na plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">4. Período de teste e acesso</h2>
            <p>
              O acesso ao Serviço pode incluir um período de teste gratuito, informado no momento do
              cadastro. Encerrado esse período, a continuidade do uso depende da aquisição do acesso ao
              sistema mediante pagamento único, sem cobrança recorrente ou mensalidade. Enquanto o
              pagamento não for confirmado, o acesso às funcionalidades permanece suspenso, sem exclusão
              imediata dos dados armazenados, ressalvado o disposto na cláusula de retenção de dados
              abaixo.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">5. Dados armazenados</h2>
            <p>
              Os dados inseridos no Serviço (clientes, contratos, valores, agenda) pertencem ao escritório
              contratante. O tratamento desses dados pelo Serviço observa a Política de Privacidade,
              disponível em <Link to="/privacidade" className="text-brand-600 hover:underline">/privacidade</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">6. Limitação de responsabilidade</h2>
            <p>
              O Serviço é fornecido "no estado em que se encontra". Na máxima extensão permitida em lei, o
              fornecedor não se responsabiliza por decisões tomadas com base nos documentos e valores
              gerados pela ferramenta, cabendo ao(à) advogado(a) usuário(a) a revisão técnica de todo
              conteúdo antes de sua utilização perante clientes ou órgãos públicos.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">7. Cancelamento</h2>
            <p>
              O escritório pode cancelar a assinatura a qualquer momento, mediante solicitação ao suporte.
              O cancelamento interrompe as cobranças futuras e mantém o acesso até o fim do período já pago.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">8. Alterações destes termos</h2>
            <p>
              Estes termos podem ser atualizados periodicamente. Alterações relevantes serão comunicadas aos
              escritórios cadastrados pelos meios de contato informados.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
