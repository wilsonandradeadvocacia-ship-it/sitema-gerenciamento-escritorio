import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { installmentsList: { orderBy: { number: "asc" } }, client: true },
  });
  return NextResponse.json(contract);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: any = {};
  if (typeof body.signed === "boolean") {
    data.signed = body.signed;
    data.signedDate = body.signed ? new Date() : null;
  }
  const contract = await prisma.contract.update({ where: { id: params.id }, data });
  return NextResponse.json(contract);
}
