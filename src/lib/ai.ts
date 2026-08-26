import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (client !== undefined) return client;
  const key = process.env.ANTHROPIC_API_KEY;
  client = key ? new Anthropic({ apiKey: key }) : null;
  return client;
}

export const AI_ENABLED = !!process.env.ANTHROPIC_API_KEY;

async function askClaude(system: string, prompt: string, maxTokens = 1024): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const res = await c.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const block = res.content[0];
    return block && block.type === "text" ? block.text : null;
  } catch (e) {
    console.error("Anthropic API error", e);
    return null;
  }
}

function extractJson<T>(text: string | null): T | null {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

// ---------------- PUBLICATIONS ----------------

export interface PublicationAnalysis {
  suggestedTask: string;
  suggestedDeadlineDays: number;
  urgency: "baixa" | "media" | "alta" | "critica";
  urgencyReason: string;
}

const DEADLINE_KEYWORDS: { pattern: RegExp; days: number; task: string; urgency: PublicationAnalysis["urgency"] }[] = [
  { pattern: /embargos de declara/i, days: 5, task: "Avaliar cabimento e protocolar Embargos de Declaração", urgency: "alta" },
  { pattern: /contesta[çc][ãa]o/i, days: 15, task: "Elaborar e protocolar Contestação", urgency: "alta" },
  { pattern: /apela[çc][ãa]o/i, days: 15, task: "Elaborar e protocolar Apelação", urgency: "critica" },
  { pattern: /recurso especial|resp\b/i, days: 15, task: "Avaliar e protocolar Recurso Especial", urgency: "critica" },
  { pattern: /agravo/i, days: 15, task: "Avaliar cabimento e protocolar Agravo", urgency: "alta" },
  { pattern: /r[ée]plica/i, days: 15, task: "Elaborar Réplica à contestação", urgency: "media" },
  { pattern: /impugna[çc][ãa]o/i, days: 15, task: "Elaborar Impugnação", urgency: "media" },
  { pattern: /manifest[ea]|manifesta[çc][ãa]o/i, days: 5, task: "Elaborar manifestação sobre o documento/decisão", urgency: "media" },
  { pattern: /audi[êe]ncia designada|designad[ao] audi[êe]ncia/i, days: 0, task: "Preparar-se para a audiência designada e agendar com o cliente", urgency: "alta" },
  { pattern: /per[íi]cia/i, days: 10, task: "Indicar assistente técnico/quesitos para a perícia", urgency: "media" },
  { pattern: /senten[çc]a/i, days: 15, task: "Analisar sentença e decidir sobre recurso", urgency: "critica" },
  { pattern: /despacho|decis[ãa]o interlocut[óo]ria/i, days: 5, task: "Analisar decisão e verificar necessidade de manifestação", urgency: "media" },
  { pattern: /intima[çc][ãa]o para pagamento|cumprimento de senten[çc]a/i, days: 15, task: "Orientar cliente sobre cumprimento de sentença/pagamento", urgency: "alta" },
  { pattern: /citaç[ãa]o/i, days: 15, task: "Verificar citação e providenciar defesa cabível", urgency: "alta" },
  { pattern: /arquivamento/i, days: 5, task: "Avaliar necessidade de desarquivamento ou medida cabível", urgency: "baixa" },
];

export function heuristicPublicationAnalysis(content: string): PublicationAnalysis {
  for (const rule of DEADLINE_KEYWORDS) {
    if (rule.pattern.test(content)) {
      return {
        suggestedTask: rule.task,
        suggestedDeadlineDays: rule.days,
        urgency: rule.urgency,
        urgencyReason: `Publicação menciona termo relevante ("${rule.pattern.source.split("|")[0]}") sugerindo prazo processual de ${rule.days} dia(s) úteis.`,
      };
    }
  }
  return {
    suggestedTask: "Ler publicação na íntegra e avaliar necessidade de providência",
    suggestedDeadlineDays: 5,
    urgency: "media",
    urgencyReason: "Não foi identificado termo processual específico; recomenda-se análise manual da publicação.",
  };
}

export async function analyzePublication(content: string, processContext?: string): Promise<PublicationAnalysis> {
  const heuristic = heuristicPublicationAnalysis(content);
  const system =
    "Você é um assistente jurídico brasileiro especializado em prazos processuais. Analise publicações de diários oficiais e responda SOMENTE em JSON válido, sem markdown, no formato: " +
    '{"suggestedTask": string, "suggestedDeadlineDays": number, "urgency": "baixa"|"media"|"alta"|"critica", "urgencyReason": string}. ' +
    "Considere o Código de Processo Civil, CLT e legislação processual aplicável ao teor da publicação. Seja objetivo e prático.";
  const prompt = `Publicação do diário oficial:\n"""${content}"""\n${processContext ? `Contexto do processo: ${processContext}\n` : ""}Gere a análise em JSON.`;
  const text = await askClaude(system, prompt, 500);
  const parsed = extractJson<PublicationAnalysis>(text);
  return parsed ?? heuristic;
}

// ---------------- PROCESS TASK SUGGESTION ----------------

export interface ProcessTaskSuggestion {
  task: string;
  urgency: "baixa" | "media" | "alta" | "critica";
}

export function heuristicProcessTask(area: string, phase: string | null, lastMovement: string | null): ProcessTaskSuggestion {
  const text = `${phase ?? ""} ${lastMovement ?? ""}`.toLowerCase();
  if (!lastMovement && !phase) {
    return { task: "Cadastrar movimentação inicial e verificar andamento no tribunal", urgency: "media" };
  }
  if (/senten[çc]a|julgad[oa]/.test(text)) return { task: "Analisar sentença e avaliar recurso cabível", urgency: "critica" };
  if (/citaç[ãa]o|cite-se/.test(text)) return { task: "Providenciar contestação/defesa dentro do prazo legal", urgency: "alta" };
  if (/audi[êe]ncia/.test(text)) return { task: "Preparar-se para audiência e alinhar com o cliente", urgency: "alta" };
  if (/per[íi]cia/.test(text)) return { task: "Acompanhar produção de prova pericial", urgency: "media" };
  if (/conclus[oõ]o|conclus[oõ]s? para/.test(text)) return { task: "Aguardar decisão judicial; monitorar andamento semanalmente", urgency: "baixa" };
  if (/recurso|apela[çc][ãa]o|agravo/.test(text)) return { task: "Acompanhar julgamento do recurso interposto", urgency: "media" };
  if (/arquivad/.test(text)) return { task: "Avaliar necessidade de desarquivamento", urgency: "baixa" };
  return { task: "Revisar autos e verificar necessidade de manifestação", urgency: "media" };
}

export async function suggestProcessTask(
  area: string,
  phase: string | null,
  lastMovement: string | null
): Promise<ProcessTaskSuggestion> {
  const heuristic = heuristicProcessTask(area, phase, lastMovement);
  const system =
    "Você é um advogado brasileiro sênior. Com base na área do processo, fase atual e última movimentação, sugira a próxima tarefa objetiva e o nível de urgência. Responda SOMENTE em JSON: " +
    '{"task": string, "urgency": "baixa"|"media"|"alta"|"critica"}.';
  const prompt = `Área: ${area}\nFase atual: ${phase ?? "não informada"}\nÚltima movimentação: ${lastMovement ?? "não informada"}`;
  const text = await askClaude(system, prompt, 300);
  const parsed = extractJson<ProcessTaskSuggestion>(text);
  return parsed ?? heuristic;
}

// ---------------- MARKETING ----------------

export type MarketingContentType =
  | "instagram_post"
  | "instagram_carousel"
  | "instagram_reels"
  | "facebook_post"
  | "artigo";

export interface MarketingSlide {
  title: string;
  body: string;
}

export interface GeneratedMarketingContent {
  headline?: string;
  body: string;
  slides?: MarketingSlide[];
  hashtags?: string[];
  complianceNote: string;
}

const OAB_SYSTEM_PROMPT = `Você é um especialista em marketing jurídico brasileiro, redigindo para um escritório de advocacia real, sujeito ao Código de Ética da OAB e ao Provimento 205/2021 do CFOAB.

Regra central: INFORME E DEMONSTRE, NUNCA OFERTE, PROMETA OU PRECIFIQUE. O conteúdo existe para que o leitor entenda um problema jurídico e conclua sozinho que precisa de um advogado — quem faz a oferta é o cliente, não o escritório.

Estrutura obrigatória do conteúdo (adapte ao formato pedido, mas mantenha a lógica):
1. Situação-problema descrita de forma IMPESSOAL (nunca 2ª pessoa tipo "você tem direito a...").
2. Explicação técnica com base normativa (lei, artigo, súmula ou tema repetitivo) — cite APENAS o que você tem certeza; se não tiver certeza do número exato do dispositivo, use algo como "[confirmar dispositivo exato antes de publicar]" em vez de inventar.
3. Uma nuance, exceção ou erro comum — é isso que demonstra domínio real e diferencia de conteúdo raso.
4. Fechamento informativo, NUNCA comercial: algo como "Cada caso depende da análise dos documentos e do contexto específico." Nunca "fale conosco", "agende sua consulta" ou similar.

Proibido em qualquer hipótese: mencionar honorários, valores, "consulta gratuita" ou desconto; ofertar serviço ou convocar para contratar; prometer ou insinuar resultado; citar caso concreto identificável (nomes, prints, detalhes que identifiquem cliente); autoengrandecimento ("o melhor", "referência", "líder"); ostentação; incentivo a litígio ou urgência artificial ("corre que o prazo acaba", "não perca tempo").

Escreva sempre em português do Brasil, com profundidade real — o leitor deve terminar sabendo mais sobre o tema do que sabia antes, não apenas ter lido um gancho publicitário.`;

function complianceNoteFallback(): string {
  return "Conformidade OAB: informação/marketing de conteúdo (permitido). Verificado sem honorários, oferta, promessa de resultado, caso identificável, autoengrandecimento ou ostentação. Revise a base normativa citada antes de publicar e inclua a identificação do escritório (nome + OAB).";
}

function buildMarketingPrompt(type: MarketingContentType, area: string, brief: string): { prompt: string; maxTokens: number; jsonMode: boolean } {
  const header = `Área do direito: ${area}\nTema/objetivo do conteúdo: ${brief}\n\n`;

  switch (type) {
    case "instagram_carousel":
      return {
        maxTokens: 2500,
        jsonMode: true,
        prompt:
          header +
          `Crie um CARROSSEL para Instagram com 7 a 9 telas seguindo esta estrutura:
- Tela 1 (capa): a pergunta ou conceito central, sem clickbait, sem emoji de alerta, sem caixa alta.
- Telas 2-3: o problema em situação impessoal.
- Telas 4-6: a explicação técnica, uma ideia por tela, com base legal.
- Penúltima tela: a nuance, exceção ou erro comum.
- Última tela: fechamento informativo + nome do escritório "Wilson Andrade Advocacia e Consultoria Jurídica" + "OAB/AL 14.662". Sem CTA de venda.

Depois, escreva a LEGENDA do post (desenvolva o conteúdo em prosa, não repita a arte, 150-300 palavras) e 5 a 8 hashtags de TEMA (ex. #direitotributario), nunca de captação (nunca #advogadobarato ou similar).

Responda SOMENTE em JSON válido, sem markdown, neste formato exato:
{"slides": [{"title": "...", "body": "..."}, ...], "body": "<legenda completa>", "hashtags": ["...", ...]}`,
      };

    case "instagram_post":
      return {
        maxTokens: 1400,
        jsonMode: true,
        prompt:
          header +
          `Crie um POST ÚNICO para Instagram (não carrossel): uma frase-gancho curta para a arte da imagem (headline, até 12 palavras, sem clickbait) e uma legenda completa desenvolvendo o tema em prosa (150-250 palavras) seguindo a estrutura obrigatória. Finalize com 5 a 8 hashtags de tema.

Responda SOMENTE em JSON válido: {"headline": "...", "body": "<legenda completa>", "hashtags": ["...", ...]}`,
      };

    case "instagram_reels":
      return {
        maxTokens: 1400,
        jsonMode: true,
        prompt:
          header +
          `Crie um ROTEIRO para Reels/vídeo curto (30-60s) sobre o tema, com marcação de tempo aproximada por bloco (gancho, problema, explicação técnica, nuance, fechamento), e a legenda de publicação com hashtags de tema.

Responda SOMENTE em JSON válido: {"headline": "<gancho de abertura>", "body": "<roteiro com marcação de tempo>\\n\\nLegenda: <legenda completa>", "hashtags": ["...", ...]}`,
      };

    case "facebook_post":
      return {
        maxTokens: 1600,
        jsonMode: true,
        prompt:
          header +
          `Crie um POST para Facebook: o público do Facebook tolera texto mais longo e institucional que o Instagram. Escreva 250-400 palavras seguindo a estrutura obrigatória, tom levemente mais formal, terminando com a identificação do escritório. Sugira também 3-5 hashtags de tema (uso é mais discreto no Facebook que no Instagram).

Responda SOMENTE em JSON válido: {"body": "<texto completo do post>", "hashtags": ["...", ...]}`,
      };

    case "artigo":
    default:
      return {
        maxTokens: 4000,
        jsonMode: false,
        prompt:
          header +
          `Escreva um ARTIGO de blog/site com 900 a 1500 palavras: título que responde a uma busca real (não "genérico"), introdução, 3 a 5 subtítulos com ## markdown, base normativa explícita e citações verificáveis, uma seção de nuance/exceção, e conclusão informativa (nunca "fale conosco"). Tom institucional e didático.`,
      };
  }
}

function heuristicMarketingContent(type: MarketingContentType, area: string, brief: string): GeneratedMarketingContent {
  const firmLine = "Wilson Andrade Advocacia e Consultoria Jurídica — OAB/AL 14.662";
  const explicacao = `[Situação-problema] Casos envolvendo "${brief}" na área de Direito ${area} costumam gerar dúvidas recorrentes sobre como a legislação se aplica ao caso concreto.\n\n[Explicação técnica] A análise depende da norma aplicável — [confirmar dispositivo exato: lei, artigo ou súmula pertinente a "${brief}"] — e dos fatos específicos de cada situação.\n\n[Nuance] Um erro comum é tratar esse tema de forma genérica; exceções e prazos específicos costumam mudar o resultado da análise.\n\n[Fechamento] Cada caso depende da análise dos documentos e do contexto específico.`;
  const hashtags = [`#direito${area.replace(/\s+/g, "").toLowerCase()}`, "#wilsonandradeadvocacia", "#direitosdocidadao", "#consultoriajuridica", "#maceio"];

  if (type === "instagram_carousel") {
    return {
      slides: [
        { title: brief, body: "" },
        { title: "O problema", body: `Situação recorrente envolvendo ${area}.` },
        { title: "O que diz a lei", body: `[confirmar dispositivo exato aplicável a "${brief}"]` },
        { title: "Um ponto de atenção", body: "Exceções e prazos específicos costumam mudar o resultado da análise." },
        { title: firmLine, body: "Cada caso depende da análise dos documentos e do contexto específico." },
      ],
      body: explicacao,
      hashtags,
      complianceNote: complianceNoteFallback(),
    };
  }

  return {
    headline: type === "instagram_post" || type === "instagram_reels" ? brief : undefined,
    body: explicacao,
    hashtags,
    complianceNote: complianceNoteFallback(),
  };
}

export async function generateMarketingContent(
  type: MarketingContentType,
  area: string,
  brief: string
): Promise<GeneratedMarketingContent> {
  const heuristic = heuristicMarketingContent(type, area, brief);
  const { prompt, maxTokens, jsonMode } = buildMarketingPrompt(type, area, brief);

  const text = await askClaude(OAB_SYSTEM_PROMPT, prompt, maxTokens);
  if (!text) return heuristic;

  if (!jsonMode) {
    return { body: text.trim(), complianceNote: complianceNoteFallback() };
  }

  const parsed = extractJson<Partial<GeneratedMarketingContent>>(text);
  if (!parsed || !parsed.body) return heuristic;

  return {
    headline: parsed.headline,
    body: parsed.body,
    slides: parsed.slides,
    hashtags: parsed.hashtags,
    complianceNote: complianceNoteFallback(),
  };
}

// ---------------- INTAKE (Novos) CLASSIFICATION ----------------

export interface IntakeSuggestion {
  kind: "novo_cliente" | "documento_cliente" | "processo" | "financeiro" | "desconhecido";
  confidence: number;
  extracted: Record<string, string | null>;
  reasoning: string;
}

const DOC_TYPE_HINTS: { pattern: RegExp; type: string }[] = [
  { pattern: /\brg\b|identidade/i, type: "RG" },
  { pattern: /cpf/i, type: "CPF" },
  { pattern: /comprovante.*resid/i, type: "Comprovante de Residência" },
  { pattern: /cnh|habilita[çc][ãa]o/i, type: "CNH" },
  { pattern: /contrato social/i, type: "Contrato Social" },
  { pattern: /certid[ãa]o.*casamento/i, type: "Certidão de Casamento" },
  { pattern: /extrato/i, type: "Extrato Bancário" },
  { pattern: /procura[çc][ãa]o/i, type: "Procuração" },
  { pattern: /contrato.*honor[áa]rio/i, type: "Contrato de Honorários" },
];

export function heuristicIntakeClassification(fileName: string): IntakeSuggestion {
  // Normalize separators (_, -, .) to spaces so `\b` word boundaries work on
  // filenames like "RG_Maria_Teste.pdf" (underscore is a \w char, so \brg\b
  // would otherwise fail to match "rg" glued to "_maria" via regex \b rules).
  const lower = fileName.toLowerCase().replace(/[_\-.]/g, " ");
  const hit = DOC_TYPE_HINTS.find((h) => h.pattern.test(lower));
  if (hit && ["RG", "CPF", "CNH", "Comprovante de Residência", "Contrato Social", "Certidão de Casamento"].includes(hit.type)) {
    return {
      kind: "documento_cliente",
      confidence: 0.55,
      extracted: { docType: hit.type },
      reasoning: `Nome do arquivo sugere documento pessoal do tipo "${hit.type}". Verifique se o cliente já está cadastrado ou crie um novo cadastro.`,
    };
  }
  if (hit && hit.type === "Extrato Bancário") {
    return {
      kind: "financeiro",
      confidence: 0.6,
      extracted: { docType: hit.type },
      reasoning: "Nome do arquivo sugere extrato bancário. Pode ser importado na área Financeiro.",
    };
  }
  if (hit) {
    return {
      kind: "documento_cliente",
      confidence: 0.4,
      extracted: { docType: hit.type },
      reasoning: `Documento identificado como "${hit.type}".`,
    };
  }
  return {
    kind: "desconhecido",
    confidence: 0.2,
    extracted: {},
    reasoning: "Não foi possível identificar o tipo de documento pelo nome do arquivo. Classifique manualmente.",
  };
}

export async function classifyIntakeFile(fileName: string): Promise<IntakeSuggestion> {
  const heuristic = heuristicIntakeClassification(fileName);
  const system =
    "Você organiza documentos para um escritório de advocacia brasileiro. Dado o nome de um arquivo recém enviado, classifique-o. Responda SOMENTE em JSON: " +
    '{"kind": "novo_cliente"|"documento_cliente"|"processo"|"financeiro"|"desconhecido", "confidence": number (0-1), "extracted": object, "reasoning": string}.';
  const prompt = `Nome do arquivo: "${fileName}"`;
  const text = await askClaude(system, prompt, 300);
  const parsed = extractJson<IntakeSuggestion>(text);
  return parsed ?? heuristic;
}
