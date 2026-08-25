import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { suggestProcessTask } from "@/lib/ai";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const process = await prisma.process.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      responsible: true,
      movements: { orderBy: { date: "desc" } },
      events: { orderBy: { date: "asc" } },
      publications: { orderBy: { date: "desc" } },
      contracts: true,
      powersOfAtty: true,
    },
  });
  if (!process) return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });

  if (!process.suggestedTask) {
    const suggestion = await suggestProcessTask(process.area, process.phase, process.movements[0]?.description ?? null);
    await prisma.process.update({
      where: { id: process.id },
      data: { suggestedTask: suggestion.task, suggestedUrgency: suggestion.urgency },
    });
    (process as any).suggestedTask = suggestion.task;
    (process as any).suggestedUrgency = suggestion.urgency;
  }

  return NextResponse.json(process);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const process = await prisma.process.update({
    where: { id: params.id },
    data: {
      number: body.number,
      area: body.area,
      court: body.court,
      instance: body.instance,
      status: body.status,
      phase: body.phase,
      subject: body.subject,
      causeValue: body.causeValue != null ? Number(body.causeValue) : undefined,
      responsibleId: body.responsibleId,
    },
  });
  return NextResponse.json(process);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.process.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
