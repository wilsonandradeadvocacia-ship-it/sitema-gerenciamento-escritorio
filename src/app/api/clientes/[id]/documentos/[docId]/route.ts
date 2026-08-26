import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; docId: string } }) {
  await prisma.clientDocument.delete({ where: { id: params.docId } });
  return NextResponse.json({ ok: true });
}
