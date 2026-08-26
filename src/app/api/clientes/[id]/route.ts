import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      processes: { include: { movements: { orderBy: { date: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" } },
      contracts: { orderBy: { createdAt: "desc" }, include: { installmentsList: { orderBy: { number: "asc" } } } },
      powersOfAtty: { orderBy: { createdAt: "desc" } },
      transactions: { orderBy: { date: "desc" }, take: 20 },
    },
  });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const client = await prisma.client.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
