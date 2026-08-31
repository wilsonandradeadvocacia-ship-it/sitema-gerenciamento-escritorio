"use client";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui";
import PostComposer from "./PostComposer";

const TYPE_LABELS: Record<string, string> = {
  instagram_post: "Post Instagram",
  instagram_carousel: "Carrossel Instagram",
  instagram_reels: "Reels Instagram",
  facebook_post: "Post Facebook",
  linkedin_post: "Post LinkedIn",
  // tipo legado (conteúdo gerado antes da troca por Post LinkedIn)
  artigo: "Artigo de blog",
  // tipos legados
  post: "Post",
  legenda: "Legenda",
  imagem_prompt: "Prompt de imagem",
};

export default function MarketingContentCard({ content, allPosts, hasInstagram, onChanged }: { content: any; allPosts: any[]; hasInstagram: boolean; onChanged: () => void }) {
  let parsed: any = null;
  try {
    parsed = JSON.parse(content.content);
  } catch {
    parsed = null;
  }

  const imagePaths: string[] = content.imagePaths ? JSON.parse(content.imagePaths) : [];
  const posts = allPosts.filter((p) => p.contentId === content.id);

  const captionText = parsed
    ? [parsed.body, parsed.hashtags?.length ? parsed.hashtags.join(" ") : ""].filter(Boolean).join("\n\n")
    : content.content;

  // Tipo legado: conteúdo de "Artigo de blog" gerado antes da troca por "Post
  // LinkedIn" não tem imagem/slides — mantém a renderização antiga (só corpo)
  // para não quebrar campanhas já existentes.
  const isLegacyArticle = content.type === "artigo";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="badge bg-gold-50 text-gold-700 border-gold-200">{TYPE_LABELS[content.type] ?? content.type}</span>
        <span className="text-xs text-navy-400">{new Date(content.createdAt).toLocaleDateString("pt-BR")}</span>
      </div>
      {content.title && <p className="text-sm font-medium text-navy-700 mb-3">{content.title}</p>}

      {!parsed ? (
        <div className="text-sm text-navy-700 whitespace-pre-wrap leading-relaxed">{content.content}</div>
      ) : isLegacyArticle ? (
        <div className="text-sm text-navy-700 whitespace-pre-wrap leading-relaxed">{parsed.body}</div>
      ) : (
        <>
          {imagePaths.length > 0 && (
            <div className={`grid gap-2 mb-3 ${imagePaths.length > 1 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1 max-w-xs"}`}>
              {imagePaths.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p} alt={`Imagem ${i + 1}`} className="rounded-lg border border-navy-100 w-full aspect-square object-cover" />
              ))}
            </div>
          )}

          {parsed.slides?.length > 0 && (
            <details className="mb-3">
              <summary className="text-xs text-navy-400 cursor-pointer">Ver texto de cada tela do carrossel</summary>
              <ol className="mt-2 space-y-2 text-xs text-navy-600 list-decimal list-inside">
                {parsed.slides.map((s: any, i: number) => (
                  <li key={i}>
                    <strong>{s.title}</strong>
                    {s.body && <> — {s.body}</>}
                  </li>
                ))}
              </ol>
            </details>
          )}

          <p className="text-sm text-navy-700 whitespace-pre-wrap leading-relaxed">{parsed.body}</p>
          {parsed.hashtags?.length > 0 && <p className="text-xs text-gold-700 mt-2">{parsed.hashtags.join(" ")}</p>}
        </>
      )}

      {parsed?.complianceNote && (
        <p className="mt-3 text-[11px] text-navy-400 flex items-start gap-1 border-t border-navy-50 pt-2">
          <Sparkles size={11} className="text-gold-500 mt-0.5 shrink-0" /> {parsed.complianceNote}
        </p>
      )}

      {!isLegacyArticle && (content.type.startsWith("instagram") || content.type.startsWith("facebook") || content.type === "post" || content.type === "legenda") && (
        <PostComposer
          contentId={content.id}
          defaultCaption={captionText}
          imagePaths={imagePaths}
          hasInstagram={hasInstagram && imagePaths.length > 0}
          posts={posts}
          onChanged={onChanged}
        />
      )}
    </Card>
  );
}
