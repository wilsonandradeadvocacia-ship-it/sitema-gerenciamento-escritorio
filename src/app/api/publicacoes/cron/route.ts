import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzePublication } from "@/lib/ai";

export const dynamic = "force-dynamic";

/**
 * Endpoint feito para ser chamado por um agendador externo (Vercel Cron, cron do
 * sistema operacional, GitHub Actions, etc.) todos os dias às 08:00.
 *
 * Este é o ponto de integração com um provedor de diários oficiais (DJE) de todos
 * os tribunais. Não há, por padrão, acesso a uma API paga de monitoramento de
 * publicações (ex.: Escavador, Judit.io, CODILO, JusBrasil API, Malote Digital) —
 * quando o escritório contratar um desses provedores, basta implementar
 * `fetchDailyPublications()` abaixo para consultar a API do provedor e retornar
 * as publicações do dia que citem os advogados cadastrados.
 *
 * Proteja este endpoint definindo CRON_SECRET no .env e configurando o agendador
 * para enviar o header "x-cron-secret".
 */

async function fetchDailyPublications(lawyerNames: string[]): Promise<
  { tribunal: string; instance?: string; content: string; processNumber?: string; date?: string }[]
> {
  // TODO: integrar com o provedor de diários oficiais contratado pelo escritório.
  // Exemplo de contrato esperado: retornar uma publicação por citação encontrada.
  return [];
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lawyers = await prisma.lawyer.findMany({ where: { active: true } });
  const raw = await fetchDailyPublications(lawyers.map((l) => l.name));

  const created = [];
  for (const item of raw) {
    const matched = lawyers.find((l) => item.content.toLowerCase().includes(l.name.toLowerCase()));
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

  return NextResponse.json({ imported: created.length, publications: created });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
