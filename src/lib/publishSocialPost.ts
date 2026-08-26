import { prisma } from "./prisma";
import { getStoredMetaTokens, publishToFacebook, publishToInstagram } from "./meta";
import type { SocialPost } from "@prisma/client";

export async function publishSocialPost(post: SocialPost): Promise<SocialPost> {
  const tokens = await getStoredMetaTokens();
  if (!tokens) {
    return prisma.socialPost.update({
      where: { id: post.id },
      data: { status: "falhou", errorMessage: "Meta (Facebook/Instagram) não está conectado." },
    });
  }

  const imagePaths: string[] = post.imagePaths ? JSON.parse(post.imagePaths) : [];

  try {
    const result =
      post.platform === "instagram"
        ? await publishToInstagram(post.caption, imagePaths, tokens)
        : await publishToFacebook(post.caption, imagePaths, tokens);

    return prisma.socialPost.update({
      where: { id: post.id },
      data: { status: "publicado", publishedAt: new Date(), externalPostId: result.externalPostId, errorMessage: null },
    });
  } catch (e: any) {
    console.error(`Falha ao publicar post ${post.id} (${post.platform})`, e);
    return prisma.socialPost.update({
      where: { id: post.id },
      data: { status: "falhou", errorMessage: e?.message || "Erro desconhecido ao publicar." },
    });
  }
}
