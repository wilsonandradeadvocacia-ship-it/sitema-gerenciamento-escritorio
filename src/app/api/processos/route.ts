import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const area = req.nextUrl.searchParams.get("area");
  const processes = await prisma.process.findMany({
    where: area ? { area } : undefined,
    include: {
      client: { select: { id: true, name: true } },
      responsible: { select: { id: true, name: true } },
      movements: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(processes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const process = await prisma.process.create({
    data: {
      number: body.number || null,
      clientId: body.clientId,
      area: body.area,
      court: body.court || null,
      instance: body.instance || null,
      subject: body.subject || null,
      causeValue: body.causeValue ? Number(body.causeValue) : null,
      responsibleId: body.responsibleId || null,
      phase: body.phase || null,
    },
  });
  return NextResponse.json(process);
}
