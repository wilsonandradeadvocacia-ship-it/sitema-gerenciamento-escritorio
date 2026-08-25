import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildContratoDocx, buildClientQualification, saveGeneratedDoc } from "@/lib/docgen";
import { addMonths } from "date-fns";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const qualification = buildClientQualification(client);
  const startDate = body.startDate ? new Date(body.startDate) : new Date();
  const installments = Number(body.installments) || 1;
  const totalValue = body.totalValue != null ? Number(body.totalValue) : undefined;
  const installmentValue =
    body.installmentValue != null
      ? Number(body.installmentValue)
      : totalValue != null && installments > 0
      ? Math.round((totalValue / installments) * 100) / 100
      : undefined;

  const buffer = await buildContratoDocx({
    clientName: client.name,
    clientQualification: qualification,
    objectText: body.objectText,
    paymentType: body.paymentType,
    totalValue,
    installments,
    installmentValue,
    dueDay: body.dueDay ? Number(body.dueDay) : undefined,
    successFeePct: body.successFeePct ? Number(body.successFeePct) : undefined,
    bankInfo: body.bankInfo,
    startDate,
  });
  const { docxPath, pdfPath } = await saveGeneratedDoc(buffer, `contrato-${client.name.split(" ")[0]}`);

  const contract = await prisma.contract.create({
    data: {
      clientId: client.id,
      processId: body.processId || null,
      objectText: body.objectText,
      paymentType: body.paymentType,
      totalValue,
      installments,
      installmentValue,
      dueDay: body.dueDay ? Number(body.dueDay) : null,
      successFeePct: body.successFeePct ? Number(body.successFeePct) : null,
      bankInfo: body.bankInfo || null,
      startDate,
      filePath: docxPath,
    },
  });

  if (["mensal", "parcelado"].includes(body.paymentType) && installmentValue) {
    const dueDay = body.dueDay ? Number(body.dueDay) : 10;
    const rows = Array.from({ length: installments }).map((_, i) => {
      const due = addMonths(startDate, i);
      due.setDate(dueDay);
      return {
        contractId: contract.id,
        number: i + 1,
        dueDate: due,
        value: installmentValue,
      };
    });
    await prisma.contractInstallment.createMany({ data: rows });
  } else if (body.paymentType === "avista" && totalValue) {
    await prisma.contractInstallment.create({
      data: { contractId: contract.id, number: 1, dueDate: startDate, value: totalValue },
    });
  }

  return NextResponse.json({ ...contract, docxPath, pdfPath });
}
