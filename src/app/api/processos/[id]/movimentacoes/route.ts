import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { suggestProcessTask } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const movement = await prisma.processMovement.create({
    data: {
      processId: params.id,
      description: body.description,
      phase: body.phase || null,
      date: body.date ? new Date(body.date) : new Date(),
      source: body.source || "manual",
    },
  });

  const process = await prisma.process.findUnique({ where: { id: params.id } });
  const suggestion = await suggestProcessTask(process!.area, body.phase || process!.phase, body.description);

  await prisma.process.update({
    where: { id: params.id },
    data: {
      phase: body.phase || process!.phase,
      suggestedTask: suggestion.task,
      suggestedUrgency: suggestion.urgency,
    },
  });

  return NextResponse.json({ movement, suggestion });
}
