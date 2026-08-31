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
  | "linkedin_post";

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

const OAB_SYSTEM_PROMPT = `Você é um redator de marketing jurídico com mais de 15 anos de experiência, especialista em storytelling aplicado ao Direito. Já ajudou centenas de escritórios a se posicionarem como autoridade em suas áreas, escrevendo conteúdo que prende a atenção desde a primeira linha e conduz o leitor por uma narrativa — nunca uma lista de informações soltas. Você está redigindo para um escritório de advocacia real, sujeito ao Código de Ética da OAB e ao Provimento 205/2021 do CFOAB.

Regra central: INFORME E DEMONSTRE, NUNCA OFERTE, PROMETA OU PRECIFIQUE. O conteúdo existe para que o leitor entenda um problema jurídico e conclua sozinho que precisa de um advogado — quem faz a oferta é o cliente, não o escritório.

Técnica de storytelling (aplique sempre, adaptando ao formato pedido):
- Abra com uma CENA ou situação concreta que gere identificação imediata — mas SEMPRE fictícia/genérica e composta, nunca um caso real ou identificável: "É comum, no dia a dia do escritório, encontrar alguém que descobre tarde demais que...", "Imagine uma empresa que assina um contrato sem perceber uma cláusula que muda tudo...".
- Construa tensão real antes de entregar a explicação técnica — a dúvida, o risco não percebido, a injustiça, o prazo que passou batido. É a tensão que faz o leitor continuar lendo.
- Use a explicação técnica como a "virada" da história — o momento em que o leitor entende o que estava em jogo.
- Feche retomando o fio da narrativa (nunca apenas um resumo ou lista solta), deixando o leitor com a sensação de "agora eu entendo melhor", nunca "agora eu preciso contratar".
- Frases curtas, ritmo variado, sem jargão desnecessário — escreva como quem domina tanto o Direito quanto a arte de contar uma boa história.

Estrutura obrigatória do conteúdo (adapte ao formato pedido, mas mantenha a lógica):
1. Cena/situação-problema, IMPESSOAL e genérica (nunca 2ª pessoa tipo "você tem direito a...", nunca caso real).
2. A virada: explicação técnica com base normativa (lei, artigo, súmula ou tema repetitivo) — cite APENAS o que você tem certeza; se não tiver certeza do número exato do dispositivo, use algo como "[confirmar dispositivo exato antes de publicar]" em vez de inventar.
3. Uma nuance, exceção ou erro comum — é isso que demonstra domínio real e diferencia de conteúdo raso.
4. Fechamento informativo que retoma a narrativa, NUNCA comercial: algo como "Cada caso depende da análise dos documentos e do contexto específico." Nunca "fale conosco", "agende sua consulta" ou similar.

Proibido em qualquer hipótese: mencionar honorários, valores, "consulta gratuita" ou desconto; ofertar serviço ou convocar para contratar; prometer ou insinuar resultado; citar caso concreto identificável (nomes, prints, detalhes que identifiquem cliente real — cenas ilustrativas genéricas são permitidas, casos reais não); autoengrandecimento ("o melhor", "referência", "líder"); ostentação; incentivo a litígio ou urgência artificial ("corre que o prazo acaba", "não perca tempo").

Escreva sempre em português do Brasil, com profundidade real — o leitor deve terminar sabendo mais sobre o tema do que sabia antes, e deve terminar de ler porque a narrativa prendeu, não apenas porque leu um gancho publicitário.`;

function complianceNoteFallback(): string {
  return "Conformidade OAB: informação/marketing de conteúdo (permitido). Verificado sem honorários, oferta, promessa de resultado, caso identificável, autoengrandecimento ou ostentação. Revise a base normativa citada antes de publicar e inclua a identificação do escritório (nome + OAB).";
}

function buildMarketingPrompt(type: MarketingContentType, area: string, brief: string): { prompt: string; maxTokens: number } {
  const header = `Área do direito: ${area}\nTema/objetivo do conteúdo: ${brief}\n\n`;

  switch (type) {
    case "instagram_carousel":
      return {
        maxTokens: 2800,
        prompt:
          header +
          `Crie um CARROSSEL para Instagram com 7 a 9 telas contando uma pequena história:
- Tela 1 (capa): o gancho narrativo — a cena ou situação genérica que gera identificação imediata, sem clickbait, sem emoji de alerta, sem caixa alta.
- Telas 2-3: desenvolva a cena/tensão (o problema, impessoal, sem caso real).
- Telas 4-6: a virada — explicação técnica, uma ideia por tela, com base legal.
- Penúltima tela: a nuance, exceção ou erro comum.
- Última tela: fechamento informativo que retoma a narrativa + nome do escritório "Wilson Andrade Advocacia e Consultoria Jurídica" + "OAB/AL 14.662". Sem CTA de venda.

Depois, escreva a LEGENDA do post (desenvolva a narrativa completa em prosa, não repita a arte, 150-300 palavras) e 5 a 8 hashtags de TEMA (ex. #direitotributario), nunca de captação (nunca #advogadobarato ou similar).

Responda SOMENTE em JSON válido, sem markdown, neste formato exato:
{"slides": [{"title": "...", "body": "..."}, ...], "body": "<legenda completa>", "hashtags": ["...", ...]}`,
      };

    case "instagram_post":
      return {
        maxTokens: 1500,
        prompt:
          header +
          `Crie um POST ÚNICO para Instagram (não carrossel): uma frase-gancho curta e narrativa para a arte da imagem (headline, até 12 palavras, sem clickbait) e uma legenda completa que conta a história do tema em prosa (150-250 palavras) seguindo a estrutura obrigatória. Finalize com 5 a 8 hashtags de tema.

Responda SOMENTE em JSON válido: {"headline": "...", "body": "<legenda completa>", "hashtags": ["...", ...]}`,
      };

    case "instagram_reels":
      return {
        maxTokens: 1500,
        prompt:
          header +
          `Crie um ROTEIRO para Reels/vídeo curto (30-60s) sobre o tema, estruturado como uma mini-história com marcação de tempo aproximada por bloco (gancho/cena, tensão, virada técnica, nuance, fechamento), e a legenda de publicação com hashtags de tema.

Responda SOMENTE em JSON válido: {"headline": "<gancho de abertura>", "body": "<roteiro com marcação de tempo>\\n\\nLegenda: <legenda completa>", "hashtags": ["...", ...]}`,
      };

    case "facebook_post":
      return {
        maxTokens: 1700,
        prompt:
          header +
          `Crie um POST para Facebook: o público do Facebook tolera texto mais longo e institucional que o Instagram, e responde bem a narrativa. Conte a história em 250-400 palavras seguindo a estrutura obrigatória, tom levemente mais formal, terminando com a identificação do escritório. Sugira também 3-5 hashtags de tema (uso é mais discreto no Facebook que no Instagram).

Responda SOMENTE em JSON válido: {"headline": "<frase de abertura/gancho>", "body": "<texto completo do post>", "hashtags": ["...", ...]}`,
      };

    case "linkedin_post":
    default:
      return {
        maxTokens: 1900,
        prompt:
          header +
          `Crie um POST para LinkedIn: rede mais formal e profissional, voltada a tomadores de decisão (empresários, gestores, outros profissionais), que valoriza autoridade técnica contada por meio de uma narrativa curta. Comece com uma linha de abertura forte o suficiente para parar o scroll (a cena/gancho, 1-2 linhas curtas e isoladas — é assim que o LinkedIn funciona). Desenvolva a narrativa em parágrafos curtos com quebras de linha frequentes (nunca blocos densos de texto), 200-350 palavras, seguindo a estrutura obrigatória, com tom de autoridade técnica mas acessível. Pode terminar com uma pergunta reflexiva para gerar comentários (nunca um CTA comercial). Finalize com a identificação do escritório. Sugira 3-5 hashtags profissionais de tema (ex. #DireitoTributario, #Compliance).

Responda SOMENTE em JSON válido: {"headline": "<linha de abertura/gancho>", "body": "<texto completo com quebras de linha>", "hashtags": ["...", ...]}`,
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
    headline: brief,
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
  const { prompt, maxTokens } = buildMarketingPrompt(type, area, brief);

  const text = await askClaude(OAB_SYSTEM_PROMPT, prompt, maxTokens);
  if (!text) return heuristic;

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
