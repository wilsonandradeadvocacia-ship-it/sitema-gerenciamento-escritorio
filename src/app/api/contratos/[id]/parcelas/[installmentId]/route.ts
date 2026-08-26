import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; installmentId: string } }) {
  const body = await req.json();
  const installment = await prisma.contractInstallment.findUnique({ where: { id: params.installmentId } });
  if (!installment) return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 });

  const contract = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });

  const paid = !!body.paid;
  let transactionId = installment.transactionId;

  if (paid && !installment.paid) {
    let account = await prisma.financeAccount.findFirst({ orderBy: { createdAt: "asc" } });
    if (!account) {
      account = await prisma.financeAccount.create({ data: { bank: "Conta Principal", type: "corrente" } });
    }
    const tx = await prisma.financeTransaction.create({
      data: {
        accountId: account.id,
        date: new Date(),
        description: `Recebimento honorários - parcela ${installment.number}`,
        amount: installment.value,
        type: "receita",
        category: "Honorários",
        clientId: contract.clientId,
        source: "contrato",
      },
    });
    transactionId = tx.id;
  }

  const updated = await prisma.contractInstallment.update({
    where: { id: params.installmentId },
    data: { paid, paidDate: paid ? new Date() : null, transactionId: paid ? transactionId : null },
  });

  return NextResponse.json(updated);
}
