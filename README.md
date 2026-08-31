# Sistema de Gestão — Wilson Andrade Advocacia e Consultoria Jurídica

Sistema interno de gestão do escritório: processos, clientes, agenda, marketing, financeiro, advogados e modelos de documentos, com a identidade visual do escritório (logo, cores dourado/azul-marinho) e geração de documentos usando o timbrado oficial.

## Como rodar localmente

```bash
npm install
npx prisma db push      # cria o banco SQLite local (prisma/dev.db)
npx tsx prisma/seed.ts   # cadastra o advogado titular e uma conta bancária padrão
npm run dev               # http://localhost:3000
```

Para produção: `npm run build && npm start`. O app usa SQLite por padrão (arquivo `prisma/dev.db`, definido em `DATABASE_URL` no `.env`) — para múltiplos usuários simultâneos ou hospedagem serverless, troque o `datasource` do `prisma/schema.prisma` para Postgres/MySQL.

## Publicar online (Railway)

Este projeto já inclui `Dockerfile` + `docker-entrypoint.sh` prontos para o [Railway](https://railway.com). O Dockerfile instala o LibreOffice (necessário para exportar PDF) e o entrypoint cria automaticamente um volume persistente para o banco de dados e os arquivos anexados/gerados, para que nada se perca entre deploys.

**Passo a passo:**

1. Crie uma conta em [railway.com](https://railway.com) (dá pra entrar direto com a conta do GitHub).
2. Clique em **New Project → Deploy from GitHub repo** e autorize o Railway a acessar o repositório `sitema-gerenciamento-escritorio`.
3. Selecione a branch `claude/law-office-management-system-tck78z` (ou a branch principal, depois que esta PR for aceita). O Railway vai detectar o `Dockerfile` automaticamente e começar a build.
4. Enquanto builda, adicione um **Volume**: na aba do serviço, vá em **Settings → Volumes → New Volume**, monte em `/app/persistent` (esse é o caminho que o `docker-entrypoint.sh` já espera).
5. Em **Settings → Variables**, adicione (todas opcionais, mas recomendadas):
   - `ANTHROPIC_API_KEY` — para as sugestões de IA usarem o Claude de verdade
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — para conectar o Google Calendar
   - Não é necessário definir `DATABASE_URL` nem `PORT` — o entrypoint e o Railway cuidam disso automaticamente.
6. Em **Settings → Networking**, clique em **Generate Domain** para gerar o link público (algo como `seuapp.up.railway.app`). No campo de porta, use **8080** — é a porta padrão que o Railway atribui a este serviço (o `docker-entrypoint.sh` respeita a variável `PORT` que o Railway define automaticamente).
7. Pronto — qualquer novo `git push` nessa branch republica automaticamente.

> Se ao abrir o link aparecer **"Application failed to respond"**, normalmente é porque a porta configurada em Networking não bate com a porta real do app. Confira nos **Deploy Logs** a linha `Starting Next.js on port ...` e ajuste a porta em Networking para o mesmo valor.

## Variáveis de ambiente (`.env`)

| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | Sim | Caminho do banco SQLite (já configurado) |
| `ANTHROPIC_API_KEY` | Não | Habilita sugestões de IA reais (Claude) em Processos, Marketing e Triagem de Novos documentos. **Sem essa chave, o sistema usa regras heurísticas locais** que já funcionam, mas são mais simples. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Não | Habilita a sincronização da Agenda com o Google Calendar (botão "Conectar Google Calendar" na página Agenda). Crie um OAuth Client ID no Google Cloud Console com o redirect URI `http://SEU_DOMINIO/api/integrations/google/callback`. |
| `CRON_SECRET` | Não | Protege o endpoint `/api/social/cron` (agendamento de posts, ver abaixo). |

## Pontos de integração que precisam de configuração externa

O sistema foi construído com esses pontos já prontos no código, mas alguns dependem de contratos/credenciais que só o escritório pode fornecer:

1. **Google Calendar.** Configure `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` e clique em "Conectar Google Calendar" na Agenda. Sem isso, a Agenda funciona normalmente, só não sincroniza com o Google.
2. **PDF a partir dos documentos gerados (.docx → .pdf).** Requer LibreOffice (`soffice`) instalado no servidor onde o app roda. Se `soffice` não estiver disponível, o sistema continua gerando o `.docx` normalmente (formato editável), só não oferece o botão de baixar `.pdf`.
3. **Facebook e Instagram (publicar, agendar, impulsionar).** A integração com a Graph API da Meta já está implementada (`src/lib/meta.ts`) — publicação imediata, agendamento (worker próprio, não depende do agendamento nativo da Meta) e impulsionamento (Marketing API) de posts do Facebook e Instagram. Passos para habilitar:
   1. Crie um app em [developers.facebook.com](https://developers.facebook.com/apps) (tipo "Empresa").
   2. Adicione os produtos **Facebook Login for Business** e **Marketing API** ao app.
   3. Em **App Review**, solicite as permissões: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`, `ads_management`, `business_management`. A Meta exige **verificação de negócio** (Business Verification) para liberar a maioria dessas permissões em modo de produção (não apenas para usuários de teste do app) — esse processo pode levar de alguns dias a semanas, então vale iniciar com antecedência.
   4. Copie o **App ID** e o **App Secret** (em Configurações → Básico) e defina `META_APP_ID` / `META_APP_SECRET` nas variáveis de ambiente do Railway. Defina também `PUBLIC_BASE_URL` com a URL pública do sistema (ex.: `https://seuapp.up.railway.app`) — a Meta precisa buscar as imagens geradas por essa URL.
   5. Em **Facebook Login for Business → Configurações**, adicione a URI de redirecionamento OAuth: `https://SEU_DOMINIO/api/integrations/meta/callback`.
   6. Sua conta do Facebook precisa administrar a **Página** do escritório, e essa Página precisa estar vinculada à **conta comercial do Instagram** (Meta Business Suite → Configurações → Contas vinculadas) para publicar no Instagram. Para impulsionar, é necessário ter uma **conta de anúncios** com forma de pagamento cadastrada no Meta Business Manager.
   7. Clique em **"Conectar Facebook/Instagram"** na página de uma campanha em Marketing e autorize.
   8. Para o agendamento funcionar, chame periodicamente (a cada 5-15 min) `POST /api/social/cron` por um agendador externo (com o header `x-cron-secret` se `CRON_SECRET` estiver definido).

   **Sobre o impulsionamento:** o sistema cria a campanha/conjunto/anúncio sempre com status **PAUSADO** — nada é cobrado até você revisar e ativar manualmente (pelo botão no sistema ou direto no Meta Ads Manager). A OAB permite impulsionar conteúdo informativo, mas não anúncio com oferta de serviço — por isso é exigida uma confirmação explícita antes de criar a campanha.

   Sem essas credenciais, a geração de conteúdo e das imagens continua funcionando normalmente — só os botões de publicar/agendar/impulsionar ficam indisponíveis.

## Módulos

- **Visão Geral** — painel com processos ativos, clientes, agenda dos próximos 14 dias e resumo financeiro.
- **Processos** — filtro por área (cível, criminal, tributário, trabalhista, administrativo, municipal, eleitoral, família, previdenciário, sucessão, contratual), linha do tempo de movimentações e recomendação de tarefa por IA.
- **Clientes** — cadastro completo (PF/PJ), upload de documentos, geração de Procuração e Contrato de Honorários (com o timbrado oficial), confirmação de assinatura do contrato e controle de parcelas ligado ao Financeiro.
- **Agenda** — reuniões, compromissos, audiências, prazos e tarefas; integração opcional com Google Calendar.
- **Marketing** — campanhas por área do direito; geração por IA de carrossel/post/reels para Instagram, post para Facebook e post para LinkedIn, escrita com técnica de storytelling por uma persona de redator sênior (15+ anos), seguindo a estrutura de conteúdo compatível com a OAB (cena/situação → virada técnica com base normativa → nuance → fechamento informativo que retoma a narrativa), com imagens já geradas automaticamente (sem depender de API paga de imagem); publicação, agendamento e impulsionamento diretos no Facebook/Instagram via integração com a Meta; acompanhamento automático de novos processos/clientes gerados durante a campanha.
- **Financeiro** — contas bancárias, lançamentos manuais, importação de extrato (CSV, OFX/QFX, PDF ou TXT), análise mensal e projeção para os próximos 3 meses.
- **Advogados** — cadastro de advogados/colaboradores, usado na atribuição de tarefas.
- **Meus Modelos** — upload de modelos `.docx` com variáveis (`{{cliente_nome}}` etc.), geração personalizada para um cliente específico, exportação em `.docx` e `.pdf`.
- **Novos** (ícone no topo) — upload rápido de documentos com sugestão automática de onde arquivar (novo cliente, documento de cliente existente, financeiro).

## Identidade visual

Logo e timbrado extraídos dos arquivos fornecidos (`public/brand/`). Paleta dourado/azul-marinho aplicada em `tailwind.config.ts`. Todos os documentos gerados (Procuração, Contrato de Honorários, modelos) usam o timbrado oficial do escritório no cabeçalho e rodapé.
