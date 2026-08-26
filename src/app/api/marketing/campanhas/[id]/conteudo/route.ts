import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMarketingContent, MarketingContentType } from "@/lib/ai";
import { renderInstagramPostImage, renderCarouselImages } from "@/lib/imagegen";
import { AREA_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id: params.id } });
  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });

  const type = body.type as MarketingContentType;
  const areaLabel = AREA_LABEL[campaign.area] ?? campaign.area;
  const generated = await generateMarketingContent(type, areaLabel, body.brief);

  let imagePaths: string[] = [];
  try {
    if (type === "instagram_carousel" && generated.slides?.length) {
      imagePaths = await renderCarouselImages(generated.slides, areaLabel);
    } else if (type === "instagram_post") {
      imagePaths = [await renderInstagramPostImage(generated.headline || body.brief, areaLabel)];
    }
  } catch (e) {
    console.error("Falha ao gerar imagem de marketing", e);
  }

  // Serializa o conteúdo estruturado como JSON para preservar slides/hashtags/nota de conformidade.
  const contentJson = JSON.stringify({
    headline: generated.headline,
    body: generated.body,
    slides: generated.slides,
    hashtags: generated.hashtags,
    complianceNote: generated.complianceNote,
  });

  const content = await prisma.marketingContent.create({
    data: {
      campaignId: campaign.id,
      type,
      title: body.brief,
      content: contentJson,
      imagePaths: imagePaths.length ? JSON.stringify(imagePaths) : null,
    },
  });
  return NextResponse.json(content);
}
