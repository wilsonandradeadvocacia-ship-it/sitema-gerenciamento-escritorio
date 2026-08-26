import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const publication = await prisma.publication.findUnique({ where: { id: params.id } });
  if (!publication) return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });

  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.suggestedTask !== undefined) data.suggestedTask = body.suggestedTask;
  if (body.suggestedDeadlineDays !== undefined) data.suggestedDeadlineDays = body.suggestedDeadlineDays;
  if (body.urgency !== undefined) data.urgency = body.urgency;
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId;

  const updated = await prisma.publication.update({ where: { id: params.id }, data });

  let event = null;
  if (body.createTask) {
    const deadlineDays = body.suggestedDeadlineDays ?? publication.suggestedDeadlineDays ?? 5;
    event = await prisma.calendarEvent.create({
      data: {
        title: body.suggestedTask || publication.suggestedTask || "Providenciar publicação",
        type: "prazo",
        date: addDays(new Date(), deadlineDays),
        urgency: body.urgency || publication.urgency,
        processId: publication.processId,
        assignedToId: body.assignedToId || publication.assignedToId,
        publicationId: publication.id,
        description: publication.content.slice(0, 500),
      },
    });
    await prisma.publication.update({ where: { id: publication.id }, data: { status: "prazo_definido" } });
  }

  return NextResponse.json({ publication: updated, event });
}
