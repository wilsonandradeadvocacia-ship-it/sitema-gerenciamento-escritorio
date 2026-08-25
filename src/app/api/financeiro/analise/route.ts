import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, subMonths, addMonths, startOfMonth } from "date-fns";

export async function GET() {
  const since = startOfMonth(subMonths(new Date(), 11));
  const transactions = await prisma.financeTransaction.findMany({ where: { date: { gte: since } } });

  const monthly = new Map<string, { receitas: number; despesas: number }>();
  for (let i = 11; i >= 0; i--) {
    const key = format(subMonths(new Date(), i), "yyyy-MM");
    monthly.set(key, { receitas: 0, despesas: 0 });
  }
  for (const tx of transactions) {
    const key = format(new Date(tx.date), "yyyy-MM");
    const bucket = monthly.get(key);
    if (!bucket) continue;
    if (tx.amount >= 0) bucket.receitas += tx.amount;
    else bucket.despesas += Math.abs(tx.amount);
  }

  const history = Array.from(monthly.entries()).map(([month, v]) => ({
    month,
    receitas: Math.round(v.receitas * 100) / 100,
    despesas: Math.round(v.despesas * 100) / 100,
    saldo: Math.round((v.receitas - v.despesas) * 100) / 100,
  }));

  // Recurring baseline from active signed contracts (mensal/parcelado not yet fully paid)
  const activeContracts = await prisma.contract.findMany({
    where: { signed: true },
    include: { installmentsList: true },
  });
  const recurringMonthly = activeContracts.reduce((sum, c) => {
    if (c.paymentType === "mensal") return sum + (c.installmentValue ?? 0);
    return sum;
  }, 0);

  // Simple linear trend on last 6 months of saldo for projection baseline
  const last6 = history.slice(-6);
  const avgReceitas = last6.reduce((s, h) => s + h.receitas, 0) / (last6.length || 1);
  const avgDespesas = last6.reduce((s, h) => s + h.despesas, 0) / (last6.length || 1);

  const trendReceitas =
    last6.length >= 2 ? (last6[last6.length - 1].receitas - last6[0].receitas) / (last6.length - 1) : 0;

  const projection = Array.from({ length: 3 }).map((_, i) => {
    const month = format(addMonths(new Date(), i + 1), "yyyy-MM");
    const projReceita = Math.max(0, avgReceitas + trendReceitas * (i + 1));
    const baseline = Math.max(projReceita, recurringMonthly);
    return {
      month,
      receitasProjetadas: Math.round(baseline * 100) / 100,
      despesasProjetadas: Math.round(avgDespesas * 100) / 100,
      saldoProjetado: Math.round((baseline - avgDespesas) * 100) / 100,
    };
  });

  const totalReceitas = history.reduce((s, h) => s + h.receitas, 0);
  const totalDespesas = history.reduce((s, h) => s + h.despesas, 0);

  const pendingInstallments = await prisma.contractInstallment.findMany({
    where: { paid: false },
    include: { contract: { include: { client: true } } },
    orderBy: { dueDate: "asc" },
    take: 20,
  });

  return NextResponse.json({
    history,
    projection,
    totals: { receitas: totalReceitas, despesas: totalDespesas, saldo: totalReceitas - totalDespesas },
    recurringMonthly,
    pendingInstallments,
  });
}
