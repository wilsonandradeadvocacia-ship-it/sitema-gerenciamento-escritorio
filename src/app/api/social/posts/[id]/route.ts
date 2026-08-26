import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: any = {};
  if (body.caption !== undefined) data.caption = body.caption;
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    data.status = body.scheduledAt ? "agendado" : "rascunho";
  }
  const post = await prisma.socialPost.update({ where: { id: params.id }, data });
  return NextResponse.json(post);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.socialPost.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
