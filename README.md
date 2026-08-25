# Sistema de Gestão — Wilson Andrade Advocacia e Consultoria Jurídica

Sistema interno de gestão do escritório: processos, clientes, agenda, publicações, marketing, financeiro, advogados e modelos de documentos, com a identidade visual do escritório (logo, cores dourado/azul-marinho) e geração de documentos usando o timbrado oficial.

## Como rodar localmente

```bash
npm install
npx prisma db push      # cria o banco SQLite local (prisma/dev.db)
npx tsx prisma/seed.ts   # cadastra o advogado titular e uma conta bancária padrão
npm run dev               # http://localhost:3000
```

Para produção: `npm run build && npm start`. O app usa SQLite por padrão (arquivo `prisma/dev.db`, definido em `DATABASE_URL` no `.env`) — para múltiplos usuários simultâneos ou hospedagem serverless, troque o `datasource` do `prisma/schema.prisma` para Postgres/MySQL.

## Variáveis de ambiente (`.env`)

| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | Sim | Caminho do banco SQLite (já configurado) |
| `ANTHROPIC_API_KEY` | Não | Habilita sugestões de IA reais (Claude) em Publicações, Processos, Marketing e Triagem de Novos documentos. **Sem essa chave, o sistema usa regras heurísticas locais** que já funcionam, mas são mais simples. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Não | Habilita a sincronização da Agenda com o Google Calendar (botão "Conectar Google Calendar" na página Agenda). Crie um OAuth Client ID no Google Cloud Console com o redirect URI `http://SEU_DOMINIO/api/integrations/google/callback`. |
| `CRON_SECRET` | Não | Protege o endpoint `/api/publicacoes/cron` (ver abaixo). |

## Pontos de integração que precisam de configuração externa

O sistema foi construído com esses pontos já prontos no código, mas alguns dependem de contratos/credenciais que só o escritório pode fornecer:

1. **Busca automática diária de publicações (08h, todos os tribunais).** Não existe uma API pública e gratuita que cubra todos os diários oficiais do Brasil — isso exige contratar um provedor (Escavador, Judit.io, CODILO, Malote Digital etc.). O endpoint `POST /api/publicacoes/cron` já está pronto para ser chamado por um agendador externo (cron do servidor, Vercel Cron, GitHub Actions) todos os dias às 08h; basta implementar a função `fetchDailyPublications()` em `src/app/api/publicacoes/cron/route.ts` com as chamadas ao provedor escolhido. Enquanto isso, use o botão **"Importar publicação"** na página Publicações para lançar manualmente o conteúdo — a análise de prazo/urgência por IA funciona normalmente.
2. **Google Calendar.** Configure `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` e clique em "Conectar Google Calendar" na Agenda. Sem isso, a Agenda funciona normalmente, só não sincroniza com o Google.
3. **Geração de imagens para Marketing.** O gerador de conteúdo cria o *prompt* de imagem (texto descritivo); a geração da imagem em si depende de um serviço de IA de imagem (não incluso). O prompt gerado pode ser colado em qualquer gerador de imagens.
4. **PDF a partir dos documentos gerados (.docx → .pdf).** Requer LibreOffice (`soffice`) instalado no servidor onde o app roda. Se `soffice` não estiver disponível, o sistema continua gerando o `.docx` normalmente (formato editável), só não oferece o botão de baixar `.pdf`.

## Módulos

- **Visão Geral** — painel com processos ativos, clientes, publicações pendentes, agenda dos próximos 14 dias e resumo financeiro.
- **Processos** — filtro por área (cível, criminal, tributário, trabalhista, administrativo, municipal, eleitoral, família, previdenciário, sucessão, contratual), linha do tempo de movimentações e recomendação de tarefa por IA.
- **Clientes** — cadastro completo (PF/PJ), upload de documentos, geração de Procuração e Contrato de Honorários (com o timbrado oficial), confirmação de assinatura do contrato e controle de parcelas ligado ao Financeiro.
- **Agenda** — reuniões, compromissos, audiências, prazos e tarefas; integração opcional com Google Calendar.
- **Publicações** — importação manual (ou automática, uma vez configurado o provedor), reconhecimento do advogado citado, sugestão de tarefa/prazo/urgência por IA, e envio direto para a Agenda.
- **Marketing** — campanhas por área do direito, geração de posts/legendas/artigos/prompts de imagem por IA, e acompanhamento automático de novos processos/clientes gerados durante a campanha.
- **Financeiro** — contas bancárias, lançamentos manuais, importação de extrato (CSV, OFX/QFX, PDF ou TXT), análise mensal e projeção para os próximos 3 meses.
- **Advogados** — cadastro de advogados/colaboradores, usado no reconhecimento de publicações e atribuição de tarefas.
- **Meus Modelos** — upload de modelos `.docx` com variáveis (`{{cliente_nome}}` etc.), geração personalizada para um cliente específico, exportação em `.docx` e `.pdf`.
- **Novos** (ícone no topo) — upload rápido de documentos com sugestão automática de onde arquivar (novo cliente, documento de cliente existente, financeiro).

## Identidade visual

Logo e timbrado extraídos dos arquivos fornecidos (`public/brand/`). Paleta dourado/azul-marinho aplicada em `tailwind.config.ts`. Todos os documentos gerados (Procuração, Contrato de Honorários, modelos) usam o timbrado oficial do escritório no cabeçalho e rodapé.
