import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoredMetaTokens, createBoostCampaign } from "@/lib/meta";

export const dynamic = "force-dynamic";

/**
 * Cria uma campanha de impulsionamento para um post JÁ PUBLICADO no Facebook.
 * A campanha nasce PAUSADA — nunca é ativada automaticamente aqui. Exige
 * confirmação explícita (`confirmCompliance: true`) de que o conteúdo não
 * contém oferta de serviço, promessa de resultado ou honorários, já que a
 * OAB permite impulsionar conteúdo informativo, mas não anúncio comercial
 * (Provimento 205/2021).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (!body.confirmCompliance) {
    return NextResponse.json(
      { error: "É necessário confirmar que o conteúdo está em conformidade com as regras de publicidade da OAB antes de impulsionar." },
      { status: 400 }
    );
  }
  if (!body.budgetTotalBRL || !body.durationDays) {
    return NextResponse.json({ error: "Informe orçamento total e duração em dias." }, { status: 400 });
  }

  const post = await prisma.socialPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  if (post.status !== "publicado" || !post.externalPostId) {
    return NextResponse.json({ error: "Só é possível impulsionar um post já publicado." }, { status: 400 });
  }
  if (post.platform !== "facebook") {
    return NextResponse.json({ error: "Impulsionamento via API está disponível apenas para posts do Facebook por enquanto." }, { status: 400 });
  }

  const tokens = await getStoredMetaTokens();
  if (!tokens) return NextResponse.json({ error: "Meta não está conectado." }, { status: 400 });

  try {
    const boost = await createBoostCampaign(
      { postId: post.externalPostId, budgetTotalBRL: Number(body.budgetTotalBRL), durationDays: Number(body.durationDays) },
      tokens
    );

    const updated = await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        boosted: true,
        boostBudget: Number(body.budgetTotalBRL),
        boostDurationDays: Number(body.durationDays),
        boostCampaignId: boost.campaignId,
      },
    });

    return NextResponse.json({
      post: updated,
      boost,
      notice:
        "Campanha criada como PAUSADA no Meta Ads Manager. Nada foi cobrado ainda. Revise segmentação e orçamento e ative manualmente (aqui ou no Ads Manager) quando estiver pronto.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao criar campanha de impulsionamento." }, { status: 500 });
  }
}
