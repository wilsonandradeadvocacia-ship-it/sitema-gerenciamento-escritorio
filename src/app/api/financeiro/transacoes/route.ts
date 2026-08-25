import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  const transactions = await prisma.financeTransaction.findMany({
    where: accountId ? { accountId } : undefined,
    include: { client: { select: { id: true, name: true } }, account: { select: { id: true, bank: true } } },
    orderBy: { date: "desc" },
    take: 300,
  });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const amount = Number(body.amount);
  const tx = await prisma.financeTransaction.create({
    data: {
      accountId: body.accountId,
      date: body.date ? new Date(body.date) : new Date(),
      description: body.description,
      amount: body.type === "despesa" ? -Math.abs(amount) : Math.abs(amount),
      type: body.type,
      category: body.category || null,
      clientId: body.clientId || null,
      source: "manual",
    },
  });
  return NextResponse.json(tx);
}
