import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.financeAccount.findMany({
    include: { _count: { select: { transactions: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const account = await prisma.financeAccount.create({
    data: {
      bank: body.bank,
      agency: body.agency || null,
      accountNumber: body.accountNumber || null,
      type: body.type || "corrente",
      initialBalance: body.initialBalance ? Number(body.initialBalance) : 0,
    },
  });
  return NextResponse.json(account);
}
