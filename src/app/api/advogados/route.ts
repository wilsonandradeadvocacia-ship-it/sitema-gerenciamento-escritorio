import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const lawyers = await prisma.lawyer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(lawyers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const lawyer = await prisma.lawyer.create({
    data: {
      name: body.name,
      oab: body.oab || null,
      role: body.role || "advogado",
      email: body.email || null,
      phone: body.phone || null,
      areas: body.areas || null,
    },
  });
  return NextResponse.json(lawyer);
}
