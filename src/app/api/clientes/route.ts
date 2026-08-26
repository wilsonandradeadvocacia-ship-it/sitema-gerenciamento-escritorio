import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { cpfCnpj: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { processes: true, contracts: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      kind: body.kind || "PF",
      name: body.name,
      cpfCnpj: body.cpfCnpj || null,
      rg: body.rg || null,
      maritalStatus: body.maritalStatus || null,
      profession: body.profession || null,
      nationality: body.nationality || "brasileiro(a)",
      legalRepName: body.legalRepName || null,
      legalRepCpf: body.legalRepCpf || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zip: body.zip || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(client);
}
