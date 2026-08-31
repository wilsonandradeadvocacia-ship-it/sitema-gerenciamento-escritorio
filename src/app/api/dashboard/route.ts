import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const [processesByAreaRaw, activeProcesses, clients, upcomingEvents, analysis] = await Promise.all([
    prisma.process.groupBy({ by: ["area"], _count: { _all: true } }),
    prisma.process.count({ where: { status: "ativo" } }),
    prisma.client.count(),
    prisma.calendarEvent.findMany({
      where: { date: { gte: new Date(), lte: addDays(new Date(), 14) }, status: "pendente" },
      include: { client: { select: { name: true } }, process: { select: { area: true } } },
      orderBy: { date: "asc" },
      take: 8,
    }),
    prisma.financeTransaction.findMany({ where: { date: { gte: addDays(new Date(), -30) } } }),
  ]);

  const receitas30 = analysis.filter((t) => t.amount >= 0).reduce((s, t) => s + t.amount, 0);
  const despesas30 = analysis.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const processesByArea = processesByAreaRaw.map((r) => ({ area: r.area, count: r._count._all }));

  return NextResponse.json({
    activeProcesses,
    clients,
    processesByArea,
    upcomingEvents,
    finance: { receitas30, despesas30, saldo30: receitas30 - despesas30 },
  });
}
