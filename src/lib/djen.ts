/**
 * Cliente para a API pública "Comunica" do DJEN — Diário de Justiça
 * Eletrônico Nacional, mantida pelo CNJ (https://comunica.pje.jus.br). É
 * gratuita e não exige token: qualquer OAB pode ser consultada diretamente.
 *
 * PROBLEMA CONHECIDO: a infraestrutura do CNJ bloqueia requisições vindas de
 * fora do Brasil. Como o Railway não tem região no Brasil, o app hospedado lá
 * (ou qualquer ambiente de desenvolvimento fora do país) não consegue falar
 * com esse endpoint diretamente. Para contornar, configure a variável de
 * ambiente DJEN_PROXY_URL com a URL de um proxy HTTP(S) ou SOCKS5 com saída
 * no Brasil, por exemplo:
 *   DJEN_PROXY_URL="http://usuario:senha@host-proxy-brasileiro:porta"
 * Qualquer serviço de proxy/VPN com IP brasileiro serve — de um provedor
 * pago com geo-targeting BR (ex. IPRoyal, Webshare, Bright Data) a uma VPS
 * barata contratada no Brasil (ex. Hostinger, Locaweb) rodando um proxy HTTP
 * simples (ex. tinyproxy/squid). Sem essa variável definida, o cliente ainda
 * tenta a conexão direta (não custa tentar — o bloqueio pode não valer para
 * todo tipo de ambiente/rota), mas tende a falhar fora do Brasil; a falha é
 * tratada de forma silenciosa (loga o erro e retorna lista vazia) para não
 * quebrar o cron diário nem as demais funcionalidades do sistema.
 *
 * IMPORTANTE: os nomes de campo abaixo foram escritos a partir da
 * documentação pública/uso comum da API Comunica — não foi possível validar
 * com uma chamada real bem-sucedida (o ambiente onde este código foi escrito
 * não tem acesso de rede irrestrito para testar). No primeiro uso com um
 * proxy configurado, vale comparar o JSON retornado com `RawDjenItem` abaixo
 * (ex. via curl/Postman) e ajustar os nomes de campo se necessário.
 */

import { ProxyAgent } from "undici";
import { parseOab, FetchedPublication } from "./publications";

const BASE_URL = "https://comunicaapi.pje.jus.br/api/v1/comunicacao";

export const DJEN_PROXY_CONFIGURED = !!process.env.DJEN_PROXY_URL;
// DJEN não exige token — está sempre "disponível" no sentido de que o
// sistema tenta usá-lo; o que determina se a chamada terá sucesso é a rede
// (proxy brasileiro configurado ou ambiente já hospedado no Brasil).
export const DJEN_CONFIGURED = true;

function getDispatcher(): ProxyAgent | undefined {
  const proxyUrl = process.env.DJEN_PROXY_URL;
  return proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
}

interface RawDjenItem {
  texto?: string;
  numero_processo?: string;
  numeroprocessocommascara?: string;
  nomeOrgao?: string;
  nome_orgao?: string;
  siglaTribunal?: string;
  tribunalSigla?: string;
  data_disponibilizacao?: string;
  dataDisponibilizacao?: string;
  data_publicacao?: string;
}

interface RawDjenResponse {
  items?: RawDjenItem[];
  content?: RawDjenItem[];
  status?: string;
  message?: string;
}

async function djenFetch(params: Record<string, string>): Promise<RawDjenResponse | null> {
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const dispatcher = getDispatcher();

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      ...(dispatcher ? ({ dispatcher } as Record<string, unknown>) : {}),
    });
    if (!res.ok) {
      console.error(`DJEN API error ${res.status}:`, await res.text().catch(() => ""));
      return null;
    }
    return (await res.json()) as RawDjenResponse;
  } catch (e) {
    console.error(
      "Falha ao acessar a API do DJEN (provável bloqueio geográfico do CNJ para IPs fora do Brasil — configure DJEN_PROXY_URL com um proxy brasileiro):",
      e
    );
    return null;
  }
}

/**
 * Busca publicações recentes citando um advogado, pela OAB, na janela dos
 * últimos `sinceDays` dias.
 */
export async function fetchRecentPublicationsForOabDjen(oab: string, sinceDays = 1): Promise<FetchedPublication[]> {
  const parsed = parseOab(oab);
  if (!parsed) {
    console.warn(`Não foi possível interpretar a OAB "${oab}" para consulta no DJEN.`);
    return [];
  }

  const today = new Date();
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const data = await djenFetch({
    numeroOab: parsed.numero,
    ufOab: parsed.uf,
    dataDisponibilizacaoInicio: fmt(since),
    dataDisponibilizacaoFim: fmt(today),
    itensPorPagina: "100",
  });
  if (!data) return [];

  const items = data.items ?? data.content ?? [];
  const results: FetchedPublication[] = [];
  for (const item of items) {
    const content = item.texto;
    if (!content) continue;
    results.push({
      tribunal: item.siglaTribunal ?? item.tribunalSigla ?? item.nomeOrgao ?? item.nome_orgao ?? "DJEN",
      content,
      processNumber: item.numeroprocessocommascara ?? item.numero_processo,
      date: item.dataDisponibilizacao ?? item.data_disponibilizacao ?? item.data_publicacao,
    });
  }
  return results;
}

/**
 * Busca publicações recentes para todos os advogados ativos informados,
 * agregando os resultados (usado pelo cron diário).
 */
export async function fetchRecentPublicationsForLawyersDjen(
  lawyers: { oab: string | null }[],
  sinceDays = 1
): Promise<FetchedPublication[]> {
  const all: FetchedPublication[] = [];
  for (const lawyer of lawyers) {
    if (!lawyer.oab) continue;
    const found = await fetchRecentPublicationsForOabDjen(lawyer.oab, sinceDays);
    all.push(...found);
  }
  return all;
}
