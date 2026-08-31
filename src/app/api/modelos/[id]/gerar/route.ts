import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mergeDocxPlaceholders } from "@/lib/docmerge";
import { buildClientQualification } from "@/lib/docgen";
import { getFirmProfile } from "@/lib/firm";
import { convertToPdf } from "@/lib/soffice";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { v4 as uuid } from "uuid";

export const dynamic = "force-dynamic";

const GEN_ROOT = path.join(process.cwd(), "public", "uploads", "gerados");

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const template = await prisma.docTemplate.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });

  const client = body.clientId ? await prisma.client.findUnique({ where: { id: body.clientId } }) : null;
  const legalProcess = body.processId ? await prisma.process.findUnique({ where: { id: body.processId } }) : null;
  const firm = await getFirmProfile();

  const today = new Date();
  const values: Record<string, string> = {
    cliente_nome: client?.name ?? "",
    cliente_qualificacao: client ? buildClientQualification(client) : "",
    cliente_cpf_cnpj: client?.cpfCnpj ?? "",
    cliente_rg: client?.rg ?? "",
    cliente_endereco: client?.address ?? "",
    cliente_cidade: client?.city ?? "",
    cliente_estado: client?.state ?? "",
    cliente_telefone: client?.phone ?? "",
    cliente_email: client?.email ?? "",
    processo_numero: legalProcess?.number ?? "",
    processo_area: legalProcess?.area ?? "",
    processo_vara: legalProcess?.court ?? "",
    data: today.toLocaleDateString("pt-BR"),
    data_extenso: today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    advogado_nome: firm.lawyer,
    advogado_oab: firm.oab,
    escritorio_endereco: firm.address,
    ...(body.customValues || {}),
  };

  const fullPath = path.join(process.cwd(), "public", template.filePath.replace(/^\//, ""));
  const merged = await mergeDocxPlaceholders(fullPath, values);

  await mkdir(GEN_ROOT, { recursive: true });
  const id = uuid();
  const outName = `${template.name.replace(/\s+/g, "-")}-${id}.docx`;
  const outPath = path.join(GEN_ROOT, outName);
  await writeFile(outPath, merged);

  const pdfFullPath = await convertToPdf(outPath, GEN_ROOT);
  const pdfRelPath = pdfFullPath ? `/uploads/gerados/${path.basename(pdfFullPath)}` : null;

  const docxRelPath = `/uploads/gerados/${outName}`;
  const generated = await prisma.generatedDocument.create({
    data: { templateId: template.id, clientName: client?.name ?? null, filePath: docxRelPath },
  });

  return NextResponse.json({ ...generated, docxPath: docxRelPath, pdfPath: pdfRelPath });
}
