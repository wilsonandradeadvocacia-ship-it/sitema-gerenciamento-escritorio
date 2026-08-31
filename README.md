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

## O Visto — elemento de assinatura da marca

O detalhe visual que identifica o produto não é o logotipo: é **o Visto** —
uma linha de assinatura reta cuja ponta direita sobe num visto, feita num
traço só, como quem rubrica e confere ao mesmo tempo. Ele diz, numa forma
só, o que o sistema entrega: *o que antes exigia assinatura agora está feito.*

A geometria mora em `src/components/Visto.tsx` e é a única fonte do desenho —
nenhuma tela deve redesenhar o traço à mão. O componente aceita dois cortes:
`master` (3,6:1) para uso grande e `compact` (1,7:1) para uso pequeno, que é
correção óptica, não uma variante de estilo.

Regras de aplicação (não são gosto — é o que separa a marca de um checkmark
genérico de app):

- **Proporção:** linha longa e baixa, subida curta no fim. Um tique solto,
  sem a linha, não é a marca.
- **Posição:** de rubrica — rodapé, à direita, embaixo do que ele confere.
- **Tinta:** azul-caneta (`caneta-600`, `#1b39c8`), o azul real da
  esferográfica. É deliberadamente diferente do azul institucional `brand`;
  os dois não devem ser "harmonizados".
- **Uso escasso:** só onde algo foi de fato concluído — contrato assinado,
  parcela recebida, compromisso cumprido, documento gerado. Se aparecer em
  tudo, para de significar alguma coisa.
- **Sem cor:** o traço usa `currentColor` e tem que continuar legível em
  preto e branco. Ele nunca depende de cor para ser reconhecido.

A paleta tem ainda o **limão-grifo** (`grifo-500`, `#c8f53c`) como acento
escasso — uma ocorrência por tela, para marcar o que interessa (hoje, o item
ativo do menu). O dourado antigo foi aposentado: dourado com serifada é o
uniforme da categoria inteira.
