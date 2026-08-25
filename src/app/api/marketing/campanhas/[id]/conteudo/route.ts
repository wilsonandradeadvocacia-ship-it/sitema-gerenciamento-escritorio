import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMarketingContent } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id: params.id } });
  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });

  const text = await generateMarketingContent(body.type, campaign.area, body.brief);

  const content = await prisma.marketingContent.create({
    data: {
      campaignId: campaign.id,
      type: body.type,
      title: body.brief,
      content: text,
    },
  });
  return NextResponse.json(content);
}
