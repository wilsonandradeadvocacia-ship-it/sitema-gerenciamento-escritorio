import { Link } from 'react-router-dom'

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <Link to="/login" className="text-sm text-brand-600 hover:underline">
          ← Voltar
        </Link>
        <div className="card p-8 space-y-5 text-sm leading-relaxed text-slate-700">
          <h1 className="text-2xl font-serif font-semibold text-brand-900">Política de Privacidade</h1>
          <p className="text-xs text-slate-400">Última atualização: 30 de agosto de 2026.</p>
          <p>
            Esta política descreve como os dados são tratados neste sistema de gestão de escritório de
            advocacia ("Serviço"), em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados —
            LGPD).
          </p>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">1. Quem são os agentes de tratamento</h2>
            <p>
              O <strong>escritório de advocacia</strong> que cadastra clientes, contratos e dados financeiros
              no Serviço atua como <strong>controlador</strong> desses dados, definindo a finalidade e o modo
              de uso. O fornecedor do Serviço atua como <strong>operador</strong>, tratando os dados apenas
              para viabilizar o funcionamento da ferramenta, conforme instruções do escritório contratante.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">2. Dados coletados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Dados do escritório e do usuário de acesso:</strong> nome, e-mail, senha (armazenada de
                forma criptografada), número de inscrição na OAB, CPF/CNPJ, endereço profissional e, quando
                informados, dados bancários (banco, agência, conta e chave PIX) usados para constar nos
                contratos de honorários gerados.
              </li>
              <li>
                <strong>Dados de clientes do escritório:</strong> nome, CPF/CNPJ, contato, endereço e, quando
                aplicável, estado civil e profissão — inseridos pelo próprio escritório para elaboração de
                contratos e procurações.
              </li>
              <li>
                <strong>Dados financeiros:</strong> valores de honorários, parcelas, datas de vencimento e
                status de pagamento.
              </li>
              <li>
                <strong>Dados de uso e cobrança:</strong> informações sobre o plano contratado e o
                processamento de pagamentos, tratadas por meio de um gateway de pagamento terceirizado.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">3. Finalidade do tratamento</h2>
            <p>
              Os dados são utilizados exclusivamente para viabilizar as funcionalidades do Serviço: geração
              de contratos e procurações, controle financeiro, agenda de compromissos e autenticação de
              acesso. Não são utilizados para fins de publicidade de terceiros nem compartilhados com fins
              comerciais alheios à prestação do Serviço.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">4. Compartilhamento e hospedagem</h2>
            <p>
              Os dados são armazenados em infraestrutura de nuvem fornecida por terceiros (provedores de
              hospedagem e banco de dados), que podem processar os dados em servidores localizados fora do
              território nacional. Esse tratamento observa as salvaguardas previstas nos artigos 33 a 35 da
              LGPD. O processamento de pagamentos é realizado por gateway de pagamento especializado,
              conforme os termos de privacidade próprios desse provedor.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">5. Direitos do titular dos dados</h2>
            <p>
              O titular dos dados (cliente cadastrado por um escritório, ou o próprio usuário do escritório)
              pode solicitar, junto ao escritório controlador dos seus dados, a confirmação da existência de
              tratamento, acesso, correção, anonimização, portabilidade ou eliminação de dados, nos termos do
              art. 18 da LGPD. Solicitações relativas a dados de clientes de um escritório devem ser
              direcionadas diretamente a esse escritório, responsável por tais dados perante seus próprios
              clientes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">6. Retenção e exclusão</h2>
            <p>
              Os dados são mantidos enquanto a conta do escritório estiver ativa. Em caso de cancelamento da
              assinatura, os dados poderão ser retidos por um período adicional razoável para fins de
              eventual reativação e cumprimento de obrigações legais, sendo excluídos definitivamente após
              esse prazo, mediante solicitação.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">7. Segurança</h2>
            <p>
              Senhas são armazenadas com hash criptográfico (nunca em texto plano), o acesso à API exige
              autenticação por token, e os dados de cada escritório são isolados logicamente dos demais
              escritórios cadastrados na plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-800 mb-1">8. Contato</h2>
            <p>
              Dúvidas sobre esta política ou solicitações relacionadas a dados pessoais podem ser
              encaminhadas ao escritório responsável pelo cadastro ou, em relação ao funcionamento da
              plataforma, ao suporte informado no momento da contratação.
            </p>
          </section>

          <p className="text-xs text-slate-400 pt-2">
            Consulte também os <Link to="/termos" className="text-brand-600 hover:underline">Termos de Uso</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
