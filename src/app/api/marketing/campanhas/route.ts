import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const campaigns = await prisma.marketingCampaign.findMany({
    include: { _count: { select: { contents: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const campaign = await prisma.marketingCampaign.create({
    data: {
      name: body.name,
      area: body.area,
      goal: body.goal || null,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : null,
      budget: body.budget ? Number(body.budget) : null,
    },
  });
  return NextResponse.json(campaign);
}
