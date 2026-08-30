# Sistema de Gestão de Escritório de Advocacia

Painel de visão geral, cadastro de clientes, calculadora de honorários (com
tabelas de referência das 27 seccionais da OAB), geração de contrato de
honorários e procuração, financeiro e agenda — com backend próprio (API +
banco de dados) e login multiusuário/multiescritório.

## Arquitetura

- `src/` — frontend (React + TypeScript + Vite + Tailwind), consome a API.
- `server/` — backend (Node + Express + Prisma), banco SQLite por padrão.

Cada escritório que se cadastra (`/registro`) tem seus próprios dados
isolados (clientes, contratos, financeiro, agenda, tabelas OAB) — não há mais
armazenamento em `localStorage`.

## Rodando localmente

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run prisma:migrate   # cria o banco SQLite e as tabelas
npm run dev              # sobe a API em http://localhost:8787
```

### 2. Frontend

Em outro terminal, na raiz do projeto:

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8787 (padrão já funciona)
npm install
npm run dev              # sobe o app em http://localhost:5173
```

Acesse `http://localhost:5173/registro` para criar a conta do escritório.

## Deploy (publicar para os clientes usarem)

Este é o ponto principal para transformar o sistema em um produto vendável:
ninguém deve precisar rodar comandos no terminal. A combinação recomendada
(mais simples de configurar pelo painel web, sem usar linha de comando):

- **Backend + banco de dados → Railway** (tem disco persistente, funciona
  direto com SQLite). Repositório já vem com `server/railway.toml`
  configurado e `npm start` já roda as migrações do banco automaticamente a
  cada deploy.
  1. Crie uma conta em railway.app (dá para entrar direto com o GitHub).
  2. New Project → Deploy from GitHub repo → selecione este repositório.
  3. Nas configurações do serviço, defina **Root Directory** como `server`.
  4. Adicione um **Volume** (aba Volumes), montado em `/data`.
  5. Em Variables, adicione:
     - `DATABASE_URL` = `file:/data/dev.db`
     - `JWT_SECRET` = uma string aleatória longa (gere uma nova, não reuse)
     - `CORS_ORIGIN` = a URL do frontend (você preenche isso depois de
       publicar o frontend no passo seguinte)
  6. Gere um domínio público para o serviço (Settings → Networking →
     Generate Domain). Essa é a URL da API.

- **Frontend → Vercel** (site estático, plano gratuito). Repositório já vem
  com `vercel.json` configurado para as rotas do React funcionarem.
  1. Crie uma conta em vercel.com (dá para entrar com o GitHub).
  2. Add New → Project → importe este repositório (mantenha o Root
     Directory como a raiz do projeto — não é a pasta `server`).
  3. Em Environment Variables, adicione `VITE_API_URL` com a URL pública
     gerada pelo Railway no passo anterior.
  4. Deploy. A URL gerada pela Vercel é o link final do sistema.
  5. Volte no Railway e atualize a variável `CORS_ORIGIN` com essa URL da
     Vercel, depois faça um redeploy do serviço do backend.

### Assinatura, trial e administração da plataforma

Além das variáveis acima, o backend (Railway) aceita:

- `SUPERADMIN_EMAILS` = lista de e-mails separados por vírgula (ex.:
  `voce@escritorio.com,socio@escritorio.com`) que têm acesso ao painel
  "Administração" (`/admin/escritorios`), enxergam todos os escritórios
  cadastrados e não são bloqueados por trial/assinatura vencida. Coloque
  aqui o seu próprio e-mail de login para acessar o painel em produção.
- `ASAAS_API_KEY` = chave de API da conta Asaas (sandbox para testes,
  produção para cobrança real). Sem essa variável, o botão "Assinar agora"
  falha com uma mensagem clara, mas o resto do sistema continua funcionando
  normalmente (o bloqueio por trial ainda funciona).
- `ASAAS_ENV` = `sandbox` ou `production` (padrão: `sandbox`).
- `ASAAS_WEBHOOK_TOKEN` = token que você escolhe e cadastra também no painel
  do Asaas (Configurações → Webhooks), na URL
  `https://<seu-dominio-railway>/api/assinatura/webhook`, para validar que
  as notificações de pagamento realmente vêm do Asaas.
- `VALOR_PLANO_MENSAL` = valor mensal cobrado, em reais (padrão: `97`).

Todo novo escritório cadastrado ganha automaticamente 14 dias de teste
gratuito. Escritórios já existentes antes deste recurso recebem
automaticamente um período de teste de 30 dias a partir do deploy dessa
atualização, para não serem bloqueados sem aviso.

Para plataformas totalmente serverless no lugar do Railway (a própria Vercel
para o backend, por exemplo), SQLite **não funciona** porque o sistema de
arquivos é temporário — nesse caso é necessário trocar para Postgres (ex.:
Neon, Supabase): basta alterar `provider` e `DATABASE_URL` em
`server/prisma/schema.prisma` e rodar `prisma migrate deploy` novamente; o
restante do código não muda.

## Sobre as tabelas de honorários da OAB

Os dados de referência de honorários por estado ficam em
`src/data/tabelasHonorariosPesquisadas.ts` (frontend) e
`server/src/data/tabelasHonorariosPesquisadas.ts` (backend, usado para
alimentar cada novo escritório cadastrado). São dados pesquisados, com nível
de confiança variável por item, e devem ser periodicamente conferidos e
atualizados com os valores oficiais vigentes de cada seccional — a tela
"Tabelas OAB" dentro do sistema permite editar tudo isso sem precisar mexer
no código.
