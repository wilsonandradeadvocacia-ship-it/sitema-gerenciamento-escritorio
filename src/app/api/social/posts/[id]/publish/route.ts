import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishSocialPost } from "@/lib/publishSocialPost";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const post = await prisma.socialPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

  const updated = await publishSocialPost(post);
  return NextResponse.json(updated);
}
