import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishSocialPost } from "@/lib/publishSocialPost";

export const dynamic = "force-dynamic";

/**
 * Worker de publicação agendada — chame periodicamente (a cada 5-15 min) via
 * agendador externo (Railway Cron, cron-job.org, GitHub Actions). Publica todo
 * post com status "agendado" cujo scheduledAt já passou.
 *
 * Proteja com CRON_SECRET (header "x-cron-secret").
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await prisma.socialPost.findMany({
    where: { status: "agendado", scheduledAt: { lte: new Date() } },
  });

  const results = [];
  for (const post of due) {
    results.push(await publishSocialPost(post));
  }

  return NextResponse.json({ published: results.filter((r) => r.status === "publicado").length, total: due.length });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
