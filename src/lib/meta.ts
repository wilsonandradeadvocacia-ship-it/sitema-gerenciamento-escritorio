import { prisma } from "./prisma";

/**
 * Cliente para a Graph API da Meta (Facebook + Instagram), usado para publicar,
 * agendar e impulsionar posts a partir da Página do Facebook e da conta
 * comercial do Instagram vinculada a ela.
 *
 * Requer um App criado em developers.facebook.com com os produtos "Facebook
 * Login for Business" e "Marketing API" adicionados, e as permissões
 * pages_show_list, pages_manage_posts, pages_read_engagement, instagram_basic,
 * instagram_content_publish, ads_management, business_management — a maioria
 * dessas exige App Review + verificação de negócio da Meta antes de funcionar
 * para uma Página real (não apenas para usuários de teste do app). Ver README.
 */

const GRAPH_VERSION = "v21.0";
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

export const META_CONFIGURED = !!(process.env.META_APP_ID && process.env.META_APP_SECRET);

export interface MetaTokens {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  igBusinessId: string | null;
  adAccountId: string | null;
  connectedAt: string;
}

export function getOAuthRedirectUri(origin: string): string {
  return `${origin}/api/integrations/meta/callback`;
}

export function buildAuthUrl(origin: string): string {
  const scopes = [
    "pages_show_list",
    "pages_manage_posts",
    "pages_read_engagement",
    "instagram_basic",
    "instagram_content_publish",
    "read_insights",
    "ads_management",
    "business_management",
  ].join(",");

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: getOAuthRedirectUri(origin),
    scope: scopes,
    response_type: "code",
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || `Graph API error on ${path}`);
  return data as T;
}

async function graphPost<T>(path: string, body: Record<string, string | number | boolean>, accessToken: string): Promise<T> {
  const url = new URL(`${GRAPH_URL}${path}`);
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body as Record<string, string>).toString(),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || `Graph API error on POST ${path}`);
  return data as T;
}

/**
 * Troca o "code" do OAuth por um token de usuário, expande para longa duração,
 * descobre a Página conectada (+ Instagram Business vinculado + conta de
 * anúncios) e persiste tudo em Setting.
 */
export async function completeOAuth(code: string, origin: string): Promise<MetaTokens> {
  const shortLived = await graphGet<{ access_token: string }>("/oauth/access_token", {
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: getOAuthRedirectUri(origin),
    code,
  });

  const longLived = await graphGet<{ access_token: string }>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortLived.access_token,
  });

  const pages = await graphGet<{ data: { id: string; name: string; access_token: string }[] }>("/me/accounts", {
    access_token: longLived.access_token,
  });
  const page = pages.data?.[0];
  if (!page) throw new Error("Nenhuma Página do Facebook encontrada para esta conta. Conecte uma conta que administre uma Página.");

  let igBusinessId: string | null = null;
  try {
    const igLookup = await graphGet<{ instagram_business_account?: { id: string } }>(`/${page.id}`, {
      fields: "instagram_business_account",
      access_token: page.access_token,
    });
    igBusinessId = igLookup.instagram_business_account?.id ?? null;
  } catch {
    igBusinessId = null;
  }

  let adAccountId: string | null = null;
  try {
    const adAccounts = await graphGet<{ data: { id: string }[] }>("/me/adaccounts", { access_token: longLived.access_token });
    adAccountId = adAccounts.data?.[0]?.id ?? null;
  } catch {
    adAccountId = null;
  }

  const tokens: MetaTokens = {
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
    igBusinessId,
    adAccountId,
    connectedAt: new Date().toISOString(),
  };

  await prisma.setting.upsert({
    where: { key: "meta_tokens" },
    update: { value: JSON.stringify(tokens) },
    create: { key: "meta_tokens", value: JSON.stringify(tokens) },
  });

  return tokens;
}

export async function getStoredMetaTokens(): Promise<MetaTokens | null> {
  const row = await prisma.setting.findUnique({ where: { key: "meta_tokens" } });
  return row ? (JSON.parse(row.value) as MetaTokens) : null;
}

export async function isMetaConnected(): Promise<boolean> {
  return !!(await getStoredMetaTokens());
}

function absoluteUrl(path: string): string {
  const base = process.env.PUBLIC_BASE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "");
  if (!base) throw new Error("Defina PUBLIC_BASE_URL (ou implante no Railway) para publicar imagens — a Meta precisa de uma URL pública.");
  return `${base}${path}`;
}

export interface PublishResult {
  externalPostId: string;
}

/** Publica um post de texto (+ imagem opcional) na Página do Facebook. */
export async function publishToFacebook(caption: string, imagePaths: string[], tokens: MetaTokens): Promise<PublishResult> {
  if (imagePaths.length > 0) {
    const res = await graphPost<{ id: string; post_id?: string }>(
      `/${tokens.pageId}/photos`,
      { url: absoluteUrl(imagePaths[0]), caption, published: true },
      tokens.pageAccessToken
    );
    return { externalPostId: res.post_id || res.id };
  }
  const res = await graphPost<{ id: string }>(`/${tokens.pageId}/feed`, { message: caption, published: true }, tokens.pageAccessToken);
  return { externalPostId: res.id };
}

/** Publica um post (imagem única ou carrossel) na conta comercial do Instagram. */
export async function publishToInstagram(caption: string, imagePaths: string[], tokens: MetaTokens): Promise<PublishResult> {
  if (!tokens.igBusinessId) {
    throw new Error("Nenhuma conta comercial do Instagram vinculada à Página conectada.");
  }
  if (imagePaths.length === 0) {
    throw new Error("O Instagram exige ao menos uma imagem para publicar.");
  }

  if (imagePaths.length === 1) {
    const container = await graphPost<{ id: string }>(
      `/${tokens.igBusinessId}/media`,
      { image_url: absoluteUrl(imagePaths[0]), caption },
      tokens.pageAccessToken
    );
    const published = await graphPost<{ id: string }>(
      `/${tokens.igBusinessId}/media_publish`,
      { creation_id: container.id },
      tokens.pageAccessToken
    );
    return { externalPostId: published.id };
  }

  const childIds: string[] = [];
  for (const imagePath of imagePaths) {
    const child = await graphPost<{ id: string }>(
      `/${tokens.igBusinessId}/media`,
      { image_url: absoluteUrl(imagePath), is_carousel_item: true },
      tokens.pageAccessToken
    );
    childIds.push(child.id);
  }
  const parent = await graphPost<{ id: string }>(
    `/${tokens.igBusinessId}/media`,
    { media_type: "CAROUSEL", children: childIds.join(","), caption },
    tokens.pageAccessToken
  );
  const published = await graphPost<{ id: string }>(
    `/${tokens.igBusinessId}/media_publish`,
    { creation_id: parent.id },
    tokens.pageAccessToken
  );
  return { externalPostId: published.id };
}

export interface BoostParams {
  postId: string; // externalPostId (Facebook post id "pageId_postId" for object_story_id)
  budgetTotalBRL: number;
  durationDays: number;
}

export interface BoostResult {
  campaignId: string;
  adSetId: string;
  adId: string;
}

/**
 * Cria uma campanha de impulsionamento (PAUSADA por padrão — nunca ativa
 * automaticamente) referenciando um post já publicado na Página do Facebook.
 * O usuário precisa revisar e ativar manualmente (aqui ou no Meta Ads Manager)
 * para o investimento começar a ser gasto de verdade.
 */
export async function createBoostCampaign(params: BoostParams, tokens: MetaTokens): Promise<BoostResult> {
  if (!tokens.adAccountId) {
    throw new Error("Nenhuma conta de anúncios da Meta encontrada para esta conexão.");
  }

  const dailyBudgetCents = Math.max(100, Math.round((params.budgetTotalBRL / params.durationDays) * 100));
  const startTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const endTime = new Date(Date.now() + params.durationDays * 24 * 60 * 60 * 1000).toISOString();

  const campaign = await graphPost<{ id: string }>(
    `/${tokens.adAccountId}/campaigns`,
    {
      name: `Impulsionamento - ${new Date().toLocaleDateString("pt-BR")}`,
      objective: "OUTCOME_ENGAGEMENT",
      status: "PAUSED",
      special_ad_categories: "[]",
    },
    tokens.pageAccessToken
  );

  const adSet = await graphPost<{ id: string }>(
    `/${tokens.adAccountId}/adsets`,
    {
      name: "Conjunto - conteúdo informativo",
      campaign_id: campaign.id,
      daily_budget: dailyBudgetCents,
      billing_event: "IMPRESSIONS",
      optimization_goal: "POST_ENGAGEMENT",
      targeting: JSON.stringify({ geo_locations: { countries: ["BR"] } }),
      start_time: startTime,
      end_time: endTime,
      status: "PAUSED",
    },
    tokens.pageAccessToken
  );

  const creative = await graphPost<{ id: string }>(
    `/${tokens.adAccountId}/adcreatives`,
    { object_story_id: `${tokens.pageId}_${params.postId}` },
    tokens.pageAccessToken
  );

  const ad = await graphPost<{ id: string }>(
    `/${tokens.adAccountId}/ads`,
    {
      name: "Anúncio - conteúdo informativo",
      adset_id: adSet.id,
      creative: JSON.stringify({ creative_id: creative.id }),
      status: "PAUSED",
    },
    tokens.pageAccessToken
  );

  return { campaignId: campaign.id, adSetId: adSet.id, adId: ad.id };
}

/** Ativa uma campanha de impulsionamento previamente criada (PAUSED -> ACTIVE). */
export async function activateBoostCampaign(campaignId: string, tokens: MetaTokens): Promise<void> {
  await graphPost(`/${campaignId}`, { status: "ACTIVE" }, tokens.pageAccessToken);
}
