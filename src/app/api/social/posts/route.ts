import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const posts = await prisma.socialPost.findMany({
    where: status ? { status } : undefined,
    include: { content: { select: { id: true, type: true, campaignId: true } } },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

  const post = await prisma.socialPost.create({
    data: {
      contentId: body.contentId || null,
      platform: body.platform,
      caption: body.caption,
      imagePaths: body.imagePaths ? JSON.stringify(body.imagePaths) : null,
      status: scheduledAt ? "agendado" : "rascunho",
      scheduledAt,
    },
  });
  return NextResponse.json(post);
}
