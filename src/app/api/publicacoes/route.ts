import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzePublication } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const publications = await prisma.publication.findMany({
    where: status ? { status } : undefined,
    include: { matchedLawyer: true, process: { include: { client: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(publications);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const lawyers = await prisma.lawyer.findMany({ where: { active: true } });

  const matched = lawyers.find((l) => {
    const lastName = l.name.split(" ").slice(-1)[0];
    return (
      (l.oab && body.content.toLowerCase().includes(l.oab.toLowerCase())) ||
      body.content.toLowerCase().includes(l.name.toLowerCase()) ||
      (lastName.length > 3 && body.content.toLowerCase().includes(lastName.toLowerCase()))
    );
  });

  let process = null;
  if (body.processNumber) {
    process = await prisma.process.findFirst({ where: { number: body.processNumber } });
  }

  const analysis = await analyzePublication(body.content, process ? `Área: ${process.area}, fase: ${process.phase}` : undefined);

  const publication = await prisma.publication.create({
    data: {
      tribunal: body.tribunal,
      instance: body.instance || null,
      date: body.date ? new Date(body.date) : new Date(),
      processNumber: body.processNumber || null,
      processId: process?.id || null,
      content: body.content,
      matchedLawyerId: matched?.id || null,
      suggestedTask: analysis.suggestedTask,
      suggestedDeadlineDays: analysis.suggestedDeadlineDays,
      urgency: analysis.urgency,
      urgencyReason: analysis.urgencyReason,
      status: "analisado",
    },
    include: { matchedLawyer: true, process: { include: { client: true } } },
  });

  return NextResponse.json(publication);
}
