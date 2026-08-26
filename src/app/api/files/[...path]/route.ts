import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { stat, readFile } from "fs/promises";

export const dynamic = "force-dynamic";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".ofx": "application/x-ofx",
  ".qfx": "application/x-ofx",
};

/**
 * Serve arquivos de public/uploads via fs.readFile (que segue links
 * simbólicos normalmente), em vez do serving estático embutido do Next —
 * necessário porque public/uploads é um link simbólico para o volume
 * persistente do Railway (ver docker-entrypoint.sh), e o serving estático
 * padrão do Next não o resolve de forma confiável em produção.
 */
export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const segments = params.path || [];

  // Bloqueia tentativas de path traversal antes mesmo de resolver o caminho.
  if (segments.some((s) => s === ".." || s.includes("\0"))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const requested = path.join(UPLOADS_ROOT, ...segments);
  const resolved = path.resolve(requested);

  // Garante que o caminho resolvido (após seguir symlinks intermediários,
  // se houver) continue dentro da árvore esperada.
  if (!resolved.startsWith(path.resolve(UPLOADS_ROOT) + path.sep) && resolved !== path.resolve(UPLOADS_ROOT)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const st = await stat(resolved);
    if (!st.isFile()) return NextResponse.json({ error: "not found" }, { status: 404 });

    const buffer = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
