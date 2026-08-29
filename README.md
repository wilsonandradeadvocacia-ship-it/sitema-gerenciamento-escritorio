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
ninguém deve precisar rodar comandos no terminal.

**Backend + banco de dados:**
- SQLite (padrão atual) funciona bem em serviços com disco persistente, como
  Railway, Render ou Fly.io — são as opções mais simples para começar.
- Para plataformas serverless (Vercel, por exemplo), SQLite **não funciona**
  porque o sistema de arquivos é temporário. Nesse caso é necessário trocar
  para Postgres (ex.: Neon, Supabase, Railway Postgres) — basta alterar
  `provider` e `DATABASE_URL` em `server/prisma/schema.prisma` e rodar
  `prisma migrate deploy` novamente; o restante do código não muda.
- Configure as variáveis de ambiente em produção: `DATABASE_URL`,
  `JWT_SECRET` (gere um valor aleatório forte) e `CORS_ORIGIN` (domínio do
  frontend publicado).

**Frontend:**
- Publique como site estático (Vercel, Netlify, Cloudflare Pages) com
  `npm run build` gerando a pasta `dist/`.
- Configure `VITE_API_URL` apontando para a URL pública do backend.

## Sobre as tabelas de honorários da OAB

Os dados de referência de honorários por estado ficam em
`src/data/tabelasHonorariosPesquisadas.ts` (frontend) e
`server/src/data/tabelasHonorariosPesquisadas.ts` (backend, usado para
alimentar cada novo escritório cadastrado). São dados pesquisados, com nível
de confiança variável por item, e devem ser periodicamente conferidos e
atualizados com os valores oficiais vigentes de cada seccional — a tela
"Tabelas OAB" dentro do sistema permite editar tudo isso sem precisar mexer
no código.
