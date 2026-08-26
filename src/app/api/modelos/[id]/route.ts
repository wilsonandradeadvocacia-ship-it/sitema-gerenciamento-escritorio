import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const template = await prisma.docTemplate.findUnique({
    where: { id: params.id },
    include: { generated: { orderBy: { createdAt: "desc" } } },
  });
  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.docTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
