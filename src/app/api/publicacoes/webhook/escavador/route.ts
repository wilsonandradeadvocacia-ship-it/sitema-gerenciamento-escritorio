import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzePublication } from "@/lib/ai";

export const dynamic = "force-dynamic";

/**
 * Receptor de webhook para o monitoramento em tempo real do Escavador
 * (POST /api/v2/monitoramentos/processos cadastra o monitoramento; o Escavador
 * chama esta URL sempre que há uma nova movimentação/publicação).
 *
 * Configure no painel do Escavador a URL:
 *   https://SEU_DOMINIO/api/publicacoes/webhook/escavador?secret=SEU_ESCAVADOR_WEBHOOK_SECRET
 *
 * IMPORTANTE: o formato exato do payload deve ser conferido na documentação/
 * painel do Escavador quando o monitoramento estiver ativo (ou inspecionando o
 * primeiro webhook recebido nos logs) — este handler tenta reconhecer os
 * nomes de campo mais prováveis (`numero_cnj`/`numero`, `tribunal`, `conteudo`)
 * e, se não conseguir, salva o payload bruto como conteúdo para não perder a
 * publicação, permitindo ajuste fino depois.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.ESCAVADOR_WEBHOOK_SECRET;
  if (secret && req.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  console.log("Escavador webhook recebido:", JSON.stringify(payload).slice(0, 2000));

  const processNumber: string | undefined = payload.numero_cnj ?? payload.numero ?? payload.processo?.numero_cnj;
  const tribunal: string = payload.tribunal?.sigla ?? payload.tribunal?.nome ?? payload.tribunal ?? "Tribunal";
  const content: string =
    payload.conteudo ?? payload.texto_categoria ?? payload.movimentacao?.conteudo ?? JSON.stringify(payload);
  const dateStr: string | undefined = payload.data_movimentacao ?? payload.data ?? payload.movimentacao?.data;

  const lawyers = await prisma.lawyer.findMany({ where: { active: true } });
  const matched = lawyers.find((l) => content.toLowerCase().includes(l.name.toLowerCase()));

  let legalProcess = null;
  if (processNumber) {
    legalProcess = await prisma.process.findFirst({ where: { number: processNumber } });
  }

  const analysis = await analyzePublication(
    content,
    legalProcess ? `Área: ${legalProcess.area}, fase: ${legalProcess.phase}` : undefined
  );

  const publication = await prisma.publication.create({
    data: {
      tribunal,
      date: dateStr ? new Date(dateStr) : new Date(),
      processNumber: processNumber || null,
      processId: legalProcess?.id || null,
      content,
      matchedLawyerId: matched?.id || null,
      suggestedTask: analysis.suggestedTask,
      suggestedDeadlineDays: analysis.suggestedDeadlineDays,
      urgency: analysis.urgency,
      urgencyReason: analysis.urgencyReason,
      status: "analisado",
    },
  });

  return NextResponse.json({ ok: true, publicationId: publication.id });
}
