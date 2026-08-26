import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildProcuracaoDocx, buildClientQualification, saveGeneratedDoc } from "@/lib/docgen";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const qualification = buildClientQualification(client);
  const buffer = await buildProcuracaoDocx({
    clientName: client.name,
    clientQualification: qualification,
    powers: "Ad Judicia et Extra",
    scopeText: body.scopeText,
  });
  const { docxPath, pdfPath } = await saveGeneratedDoc(buffer, `procuracao-${client.name.split(" ")[0]}`);

  const record = await prisma.powerOfAttorney.create({
    data: {
      clientId: client.id,
      processId: body.processId || null,
      scopeText: body.scopeText || null,
      filePath: docxPath,
    },
  });

  return NextResponse.json({ ...record, docxPath, pdfPath });
}
