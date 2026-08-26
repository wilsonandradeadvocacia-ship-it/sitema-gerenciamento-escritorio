import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const intake = await prisma.intakeFile.findUnique({ where: { id: params.id } });
  if (!intake) return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });

  const doc = await prisma.clientDocument.create({
    data: {
      clientId: body.clientId,
      type: body.docType || "Outro",
      fileName: intake.fileName,
      filePath: intake.filePath,
    },
  });
  await prisma.intakeFile.update({ where: { id: params.id }, data: { status: "processado" } });
  return NextResponse.json(doc);
}
