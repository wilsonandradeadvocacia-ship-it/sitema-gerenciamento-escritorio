/**
 * Cliente para a API v2 do Escavador (https://api.escavador.com/v2/docs/), usado
 * para buscar processos/movimentações vinculados aos advogados cadastrados
 * (por OAB) e alimentar a área de Publicações automaticamente.
 *
 * Autenticação: header "Authorization: Bearer <ESCAVADOR_API_TOKEN>".
 *
 * IMPORTANTE: este cliente foi escrito a partir da documentação pública do
 * Escavador, sem uma chave real para testar respostas de verdade. Os nomes de
 * campos abaixo (ex.: `numero_cnj`, `movimentacoes`, `data_movimentacao`)
 * seguem o padrão documentado, mas devem ser conferidos/ajustados assim que o
 * escritório tiver um token real — a forma mais rápida é chamar
 * GET /api/v2/advogado/processos uma vez (ex. via curl ou Postman) e comparar
 * o JSON retornado com o `RawEscavadorProcess` abaixo.
 */

const BASE_URL = "https://api.escavador.com/api/v2";

export const ESCAVADOR_CONFIGURED = !!process.env.ESCAVADOR_API_TOKEN;

interface RawEscavadorMovimentacao {
  data_movimentacao?: string;
  data?: string;
  conteudo?: string;
  texto_categoria?: string;
  tipo?: string;
}

interface RawEscavadorProcess {
  numero_cnj?: string;
  numero?: string;
  unidade_origem?: { tribunal_sigla?: string; tribunal_nome?: string };
  tribunal?: { sigla?: string; nome?: string };
  instancia?: string;
  grau?: string;
  fontes?: { movimentacoes?: RawEscavadorMovimentacao[] }[];
  movimentacoes?: RawEscavadorMovimentacao[];
}

interface RawEscavadorProcessosResponse {
  items?: RawEscavadorProcess[];
  data?: RawEscavadorProcess[];
}

function parseOab(oab: string): { numero: string; uf: string } | null {
  // Aceita formatos como "OAB/AL 14.662", "AL 14662", "14662/AL", "14.662-AL"
  const match = oab.toUpperCase().match(/([A-Z]{2}).{0,5}?(\d[\d.]{3,})|(\d[\d.]{3,}).{0,5}?([A-Z]{2})/);
  if (!match) return null;
  const uf = match[1] || match[4];
  const numero = (match[2] || match[3])?.replace(/\D/g, "");
  if (!uf || !numero) return null;
  return { numero, uf };
}

async function escavadorFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const token = process.env.ESCAVADOR_API_TOKEN;
  if (!token) return null;

  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (!res.ok) {
    console.error(`Escavador API error ${res.status} on ${path}:`, await res.text().catch(() => ""));
    return null;
  }
  return (await res.json()) as T;
}

export interface FetchedPublication {
  tribunal: string;
  instance?: string;
  content: string;
  processNumber?: string;
  date?: string;
}

/**
 * Busca, para um advogado (pela OAB), os processos vinculados e retorna as
 * movimentações/publicações das últimas `sinceHours` horas.
 */
export async function fetchRecentPublicationsForOab(oab: string, sinceHours = 24): Promise<FetchedPublication[]> {
  const parsed = parseOab(oab);
  if (!parsed) {
    console.warn(`Não foi possível interpretar a OAB "${oab}" para consulta no Escavador.`);
    return [];
  }

  const data = await escavadorFetch<RawEscavadorProcessosResponse>("/advogado/processos", {
    numero_oab: parsed.numero,
    estado_oab: parsed.uf,
  });
  if (!data) return [];

  const processes = data.items ?? data.data ?? [];
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  const results: FetchedPublication[] = [];

  for (const proc of processes) {
    const movimentacoes = proc.movimentacoes ?? proc.fontes?.flatMap((f) => f.movimentacoes ?? []) ?? [];
    const tribunal = proc.unidade_origem?.tribunal_sigla ?? proc.tribunal?.sigla ?? proc.tribunal?.nome ?? "Tribunal";
    const processNumber = proc.numero_cnj ?? proc.numero;

    for (const mov of movimentacoes) {
      const dateStr = mov.data_movimentacao ?? mov.data;
      const content = mov.conteudo ?? mov.texto_categoria ?? mov.tipo;
      if (!dateStr || !content) continue;
      const date = new Date(dateStr);
      if (isNaN(date.getTime()) || date < since) continue;

      results.push({
        tribunal,
        instance: proc.instancia ?? proc.grau,
        content,
        processNumber,
        date: date.toISOString(),
      });
    }
  }

  return results;
}

/**
 * Busca publicações recentes para todos os advogados ativos informados,
 * agregando os resultados (usado pelo cron diário).
 */
export async function fetchRecentPublicationsForLawyers(
  lawyers: { oab: string | null }[],
  sinceHours = 24
): Promise<FetchedPublication[]> {
  const all: FetchedPublication[] = [];
  for (const lawyer of lawyers) {
    if (!lawyer.oab) continue;
    const found = await fetchRecentPublicationsForOab(lawyer.oab, sinceHours);
    all.push(...found);
  }
  return all;
}
