import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushEventToGoogle } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.title) data.title = body.title;
  if (body.date) data.date = new Date(body.date);
  if (body.description !== undefined) data.description = body.description;
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId;

  const event = await prisma.calendarEvent.update({ where: { id: params.id }, data });

  try {
    const redirectUri = `${req.nextUrl.origin}/api/integrations/google/callback`;
    const googleId = await pushEventToGoogle(redirectUri, event);
    if (googleId && googleId !== event.googleEventId) {
      await prisma.calendarEvent.update({ where: { id: event.id }, data: { googleEventId: googleId } });
    }
  } catch (e) {
    console.error("Google sync failed", e);
  }

  return NextResponse.json(event);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.calendarEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
