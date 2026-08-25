import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { parseCSV, parseOFX, parseStatementText } from "@/lib/statement-parser";
import path from "path";
import { readFile } from "fs/promises";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const accountId = form.get("accountId") as string;
  if (!file || !accountId) return NextResponse.json({ error: "Arquivo e conta são obrigatórios" }, { status: 400 });

  const { filePath, fileName } = await saveUploadedFile(file, "extratos");
  const ext = path.extname(fileName).toLowerCase();
  const fullPath = path.join(process.cwd(), "public", filePath);

  let parsed: { date: Date; description: string; amount: number }[] = [];
  try {
    if (ext === ".csv") {
      parsed = parseCSV(await readFile(fullPath, "utf-8"));
    } else if (ext === ".ofx" || ext === ".qfx") {
      parsed = parseOFX(await readFile(fullPath, "utf-8"));
    } else if (ext === ".pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: await readFile(fullPath) });
      const data = await parser.getText();
      await parser.destroy();
      parsed = parseStatementText(data.text);
    } else if (ext === ".txt") {
      parsed = parseStatementText(await readFile(fullPath, "utf-8"));
    }
  } catch (e) {
    console.error("Erro ao processar extrato", e);
  }

  let created = 0;
  for (const tx of parsed) {
    await prisma.financeTransaction.create({
      data: {
        accountId,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        type: tx.amount >= 0 ? "receita" : "despesa",
        source: "extrato",
      },
    });
    created++;
  }

  const receitas = parsed.filter((t) => t.amount >= 0).reduce((s, t) => s + t.amount, 0);
  const despesas = parsed.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const summary =
    created > 0
      ? `${created} lançamentos importados. Receitas: R$ ${receitas.toFixed(2)} · Despesas: R$ ${Math.abs(despesas).toFixed(2)}`
      : "Não foi possível reconhecer lançamentos automaticamente neste arquivo. Formatos suportados: CSV (data;descrição;valor), OFX/QFX, ou PDF/TXT com linhas no padrão 'dd/mm/aaaa descrição valor'.";

  const record = await prisma.bankStatementImport.create({
    data: { accountId, fileName, filePath, txCount: created, summary },
  });

  return NextResponse.json(record);
}
