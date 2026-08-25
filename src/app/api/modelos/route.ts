import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";

export const dynamic = "force-dynamic";

export async function GET() {
  const templates = await prisma.docTemplate.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const name = form.get("name") as string;
  const category = form.get("category") as string;
  if (!file || !name) return NextResponse.json({ error: "Nome e arquivo são obrigatórios" }, { status: 400 });

  const { filePath, fileName } = await saveUploadedFile(file, "modelos");
  const template = await prisma.docTemplate.create({
    data: { name, category: category || "outro", fileName, filePath },
  });
  return NextResponse.json(template);
}
