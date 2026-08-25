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

export async function generateMarketingContent(
  type: "post" | "legenda" | "artigo" | "imagem_prompt",
  area: string,
  brief: string
): Promise<string> {
  const system =
    "Você é um especialista em marketing jurídico brasileiro, atento às regras de publicidade da OAB (Provimento 205/2021): proibido prometer resultado, captar clientela de forma vil ou mencionar honorários de forma promocional. Produza conteúdo informativo, educativo e institucional, sempre em português do Brasil.";
  const typeInstructions: Record<string, string> = {
    post: "Escreva um texto curto para post de rede social (Instagram/LinkedIn), com gancho inicial, corpo educativo e call-to-action sutil (ex: 'fale com nosso escritório').",
    legenda: "Escreva uma legenda para Instagram, incluindo de 5 a 8 hashtags relevantes ao final.",
    artigo: "Escreva um artigo de blog/site com título, introdução, 3-4 subtópicos com ## markdown e conclusão. Tom institucional e educativo.",
    imagem_prompt: "Escreva um prompt descritivo em inglês para geração de imagem (estilo editorial, elegante, cores douradas e azul-marinho, tema jurídico), adequado para um gerador de imagens IA.",
  };
  const prompt = `Área do direito: ${area}\nTema/objetivo: ${brief}\n\n${typeInstructions[type]}`;
  const text = await askClaude(system, prompt, 1200);
  if (text) return text.trim();

  const fallback: Record<string, string> = {
    post: `📌 Você sabia? Questões de ${area} podem impactar diretamente sua vida ou empresa.\n\nNossa equipe está pronta para orientar você sobre ${brief}.\n\nFale com o Wilson Andrade Advocacia e entenda seus direitos.`,
    legenda: `${brief} — saiba como o Direito ${area} pode te proteger. Consulte nossa equipe. ⚖️\n\n#advocacia #direito${area.replace(/\s/g, "")} #wilsonandradeadvocacia #direitosdocidadao #consultoriajuridica #maceio #advogado`,
    artigo: `# ${brief}\n\n## Introdução\nO tema "${brief}" é recorrente na área de Direito ${area} e gera muitas dúvidas.\n\n## Pontos de atenção\nDestacamos os principais aspectos legais envolvidos.\n\n## Como o escritório pode ajudar\nNossa equipe presta consultoria especializada em ${area}.\n\n## Conclusão\nProcure orientação jurídica especializada para o seu caso.`,
    imagem_prompt: `Elegant editorial illustration representing ${area} law in Brazil, gold and navy color palette, minimalist, professional law firm aesthetic, no text`,
  };
  return fallback[type];
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
