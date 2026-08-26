import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushEventToGoogle } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const events = await prisma.calendarEvent.findMany({
    where: from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : undefined,
    include: {
      process: { select: { id: true, area: true, number: true } },
      client: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      type: body.type,
      date: new Date(body.date),
      endDate: body.endDate ? new Date(body.endDate) : null,
      allDay: !!body.allDay,
      location: body.location || null,
      description: body.description || null,
      urgency: body.urgency || null,
      processId: body.processId || null,
      clientId: body.clientId || null,
      lawyerId: body.lawyerId || null,
      assignedToId: body.assignedToId || null,
      publicationId: body.publicationId || null,
    },
  });

  try {
    const redirectUri = `${req.nextUrl.origin}/api/integrations/google/callback`;
    const googleId = await pushEventToGoogle(redirectUri, event);
    if (googleId) {
      await prisma.calendarEvent.update({ where: { id: event.id }, data: { googleEventId: googleId } });
    }
  } catch (e) {
    console.error("Google sync failed", e);
  }

  return NextResponse.json(event);
}
