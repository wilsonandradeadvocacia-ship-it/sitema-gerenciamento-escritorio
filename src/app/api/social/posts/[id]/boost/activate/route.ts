import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoredMetaTokens, activateBoostCampaign } from "@/lib/meta";

export const dynamic = "force-dynamic";

/** Ativa (PAUSED -> ACTIVE) a campanha de impulsionamento — a partir daqui o investimento passa a ser gasto de verdade. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const post = await prisma.socialPost.findUnique({ where: { id: params.id } });
  if (!post?.boostCampaignId) return NextResponse.json({ error: "Nenhuma campanha de impulsionamento encontrada para este post." }, { status: 404 });

  const tokens = await getStoredMetaTokens();
  if (!tokens) return NextResponse.json({ error: "Meta não está conectado." }, { status: 400 });

  try {
    await activateBoostCampaign(post.boostCampaignId, tokens);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao ativar campanha." }, { status: 500 });
  }
}
