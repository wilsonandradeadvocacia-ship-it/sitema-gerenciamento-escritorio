import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const type = (form.get("type") as string) || "Outro";
  if (!file) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });

  const { filePath, fileName } = await saveUploadedFile(file, `clientes/${params.id}`);
  const doc = await prisma.clientDocument.create({
    data: { clientId: params.id, type, fileName, filePath },
  });
  return NextResponse.json(doc);
}
