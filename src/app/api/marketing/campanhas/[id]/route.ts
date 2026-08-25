import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id: params.id },
    include: { contents: { orderBy: { createdAt: "desc" } }, metrics: { orderBy: { month: "asc" } } },
  });
  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });

  const rangeEnd = campaign.endDate ?? new Date();
  const newProcesses = await prisma.process.count({
    where: { area: campaign.area, createdAt: { gte: campaign.startDate, lte: rangeEnd } },
  });
  const processesInRange = await prisma.process.findMany({
    where: { area: campaign.area, createdAt: { gte: campaign.startDate, lte: rangeEnd } },
    select: { clientId: true },
  });
  const clientIds = Array.from(new Set(processesInRange.map((p) => p.clientId)));
  const contracts = await prisma.contract.findMany({ where: { clientId: { in: clientIds }, signed: true } });
  const estRevenue = contracts.reduce((s, c) => s + (c.totalValue ?? (c.installmentValue ?? 0) * (c.installments ?? 1)), 0);
  const conversionProbability = campaign.budget ? Math.min(1, estRevenue / (campaign.budget * 3)) : null;

  return NextResponse.json({
    ...campaign,
    auto: { newProcesses, newClients: clientIds.length, estRevenue, conversionProbability },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const campaign = await prisma.marketingCampaign.update({
    where: { id: params.id },
    data: { status: body.status, endDate: body.endDate ? new Date(body.endDate) : undefined },
  });
  return NextResponse.json(campaign);
}
