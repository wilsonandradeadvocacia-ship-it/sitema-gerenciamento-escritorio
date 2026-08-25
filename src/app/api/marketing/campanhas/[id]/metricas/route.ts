import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const metric = await prisma.marketingMetric.create({
    data: {
      campaignId: params.id,
      month: body.month,
      newProcesses: Number(body.newProcesses) || 0,
      newMeetings: Number(body.newMeetings) || 0,
      newClients: Number(body.newClients) || 0,
      estRevenue: Number(body.estRevenue) || 0,
    },
  });
  return NextResponse.json(metric);
}
