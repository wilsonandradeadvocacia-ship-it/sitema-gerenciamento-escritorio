import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const lawyer = await prisma.lawyer.update({
    where: { id: params.id },
    data: {
      name: body.name,
      oab: body.oab,
      role: body.role,
      email: body.email,
      phone: body.phone,
      areas: body.areas,
      active: body.active,
    },
  });
  return NextResponse.json(lawyer);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.lawyer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
