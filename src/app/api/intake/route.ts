import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { classifyIntakeFile } from "@/lib/ai";

export async function GET() {
  const files = await prisma.intakeFile.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

  const results = [];
  for (const file of files) {
    const { filePath, fileName } = await saveUploadedFile(file, "intake");
    const suggestion = await classifyIntakeFile(fileName);

    // Try to match an existing client by loose name hints in the file name
    const clients = await prisma.client.findMany({ select: { id: true, name: true } });
    const lowerFile = fileName.toLowerCase();
    const matched = clients.find((c) => {
      const parts = c.name.toLowerCase().split(/\s+/).filter((p) => p.length > 2);
      return parts.some((p) => lowerFile.includes(p));
    });

    const record = await prisma.intakeFile.create({
      data: {
        fileName,
        filePath,
        suggestion: JSON.stringify({ ...suggestion, matchedClientId: matched?.id ?? null, matchedClientName: matched?.name ?? null }),
      },
    });
    results.push(record);
  }
  return NextResponse.json(results);
}
