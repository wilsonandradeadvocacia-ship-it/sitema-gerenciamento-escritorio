import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzePublication } from "@/lib/ai";
import { ESCAVADOR_CONFIGURED, fetchRecentPublicationsForLawyers } from "@/lib/escavador";
import { DJEN_CONFIGURED, fetchRecentPublicationsForLawyersDjen } from "@/lib/djen";
import { FetchedPublication } from "@/lib/publications";

export const dynamic = "force-dynamic";

/**
 * Endpoint feito para ser chamado por um agendador externo (Vercel Cron, cron do
 * sistema operacional, GitHub Actions, etc.) todos os dias às 08:00.
 *
 * Busca publicações em dois provedores, combinando o resultado (deduplicado
 * mais abaixo pelo par processo+conteúdo):
 * 1. DJEN (src/lib/djen.ts) — API oficial e gratuita do CNJ, sem token, mas
 *    que bloqueia IPs fora do Brasil (ver DJEN_PROXY_URL no README/djen.ts).
 * 2. Escavador (src/lib/escavador.ts) — provedor pago, usado quando
 *    ESCAVADOR_API_TOKEN está configurado.
 *
 * Se nenhum dos dois retornar nada (sem proxy configurado e sem token do
 * Escavador), use o botão "Importar publicação" manualmente enquanto isso.
 *
 * Proteja este endpoint definindo CRON_SECRET no .env e configurando o agendador
 * para enviar o header "x-cron-secret".
 */

async function fetchDailyPublications(lawyers: { oab: string | null }[]): Promise<FetchedPublication[]> {
  const [fromDjen, fromEscavador] = await Promise.all([
    fetchRecentPublicationsForLawyersDjen(lawyers, 1),
    ESCAVADOR_CONFIGURED ? fetchRecentPublicationsForLawyers(lawyers, 24) : Promise.resolve([]),
  ]);
  return [...fromDjen, ...fromEscavador];
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lawyers = await prisma.lawyer.findMany({ where: { active: true } });
  const raw = await fetchDailyPublications(lawyers.map((l) => ({ oab: l.oab })));

  const created = [];
  for (const item of raw) {
    // Evita duplicar publicações já importadas para o mesmo processo/conteúdo.
    const exists = await prisma.publication.findFirst({
      where: { processNumber: item.processNumber ?? undefined, content: item.content },
    });
    if (exists) continue;

    const matched = lawyers.find((l) => l.name && item.content.toLowerCase().includes(l.name.toLowerCase()));
    const analysis = await analyzePublication(item.content);
    const publication = await prisma.publication.create({
      data: {
        tribunal: item.tribunal,
        instance: item.instance || null,
        date: item.date ? new Date(item.date) : new Date(),
        processNumber: item.processNumber || null,
        content: item.content,
        matchedLawyerId: matched?.id || null,
        suggestedTask: analysis.suggestedTask,
        suggestedDeadlineDays: analysis.suggestedDeadlineDays,
        urgency: analysis.urgency,
        urgencyReason: analysis.urgencyReason,
        status: "analisado",
      },
    });
    created.push(publication);
  }

  return NextResponse.json({
    imported: created.length,
    publications: created,
    providers: {
      djenProxyConfigured: DJEN_CONFIGURED && !!process.env.DJEN_PROXY_URL,
      escavadorConfigured: ESCAVADOR_CONFIGURED,
    },
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
