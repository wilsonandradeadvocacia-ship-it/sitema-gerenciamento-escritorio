import sharp from "sharp";
import path from "path";
import { readFile, mkdir } from "fs/promises";
import { v4 as uuid } from "uuid";

const SIZE = 1080;
const NAVY = "#141c2e";
const NAVY_DEEP = "#0c121e";
const GOLD = "#b8935c";
const GOLD_LIGHT = "#e7d3ad";
const CREAM = "#f7f5f1";

const GEN_ROOT = path.join(process.cwd(), "public", "uploads", "marketing");

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Approximate greedy word-wrap by character count (SVG <text> has no native
// wrapping). Char width is estimated as a fraction of font size; tuned for a
// generic sans/serif system font rendered by librsvg — not pixel-perfect,
// but keeps lines from overflowing the 1080px card at the sizes we use.
function wrapText(text: string, fontSize: number, maxWidth: number, avgCharWidthRatio = 0.56): string[] {
  const maxChars = Math.max(4, Math.floor(maxWidth / (fontSize * avgCharWidthRatio)));
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function textBlock(lines: string[], x: number, startY: number, lineHeight: number, opts: { fontSize: number; fill: string; weight?: number; family?: string; anchor?: string }): string {
  const anchor = opts.anchor ?? "start";
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${startY + i * lineHeight}" font-size="${opts.fontSize}" font-family="${opts.family ?? "sans-serif"}" font-weight="${opts.weight ?? 400}" fill="${opts.fill}" text-anchor="${anchor}">${escapeXml(line)}</text>`
    )
    .join("\n");
}

async function logoBase64(): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "brand", "logo-icon.png"));
    return buf.toString("base64");
  } catch {
    return null;
  }
}

interface CardOptions {
  eyebrow?: string; // small label above title (e.g. "1/8", "DIREITO TRIBUTÁRIO")
  title: string;
  body?: string;
  footer?: string; // e.g. firm name, shown small at bottom
  variant?: "dark" | "light";
}

async function renderCard(opts: CardOptions): Promise<Buffer> {
  const dark = opts.variant !== "light";
  const bg = dark ? NAVY : CREAM;
  const bgDeep = dark ? NAVY_DEEP : "#ece7dc";
  const titleColor = dark ? GOLD_LIGHT : NAVY;
  const bodyColor = dark ? "#e7e9ee" : "#2a3244";
  const eyebrowColor = GOLD;

  const margin = 90;
  const contentWidth = SIZE - margin * 2;
  const logo = await logoBase64();

  const eyebrowLines = opts.eyebrow ? wrapText(opts.eyebrow.toUpperCase(), 28, contentWidth) : [];
  const titleLines = wrapText(opts.title, 56, contentWidth, 0.52);
  const bodyLines = opts.body ? wrapText(opts.body, 32, contentWidth) : [];

  let cursorY = 420 - (titleLines.length > 3 ? (titleLines.length - 3) * 34 : 0);
  if (eyebrowLines.length) cursorY -= 60;

  const eyebrowSvg = eyebrowLines.length
    ? textBlock(eyebrowLines, margin, cursorY, 34, { fontSize: 28, fill: eyebrowColor, weight: 700, family: "sans-serif" })
    : "";
  const titleStartY = cursorY + (eyebrowLines.length ? 70 : 0) + 56;
  const titleSvg = textBlock(titleLines, margin, titleStartY, 68, { fontSize: 56, fill: titleColor, weight: 700, family: "serif" });

  const bodyStartY = titleStartY + titleLines.length * 68 + 60;
  const bodySvg = bodyLines.length
    ? textBlock(bodyLines.slice(0, 10), margin, bodyStartY, 44, { fontSize: 32, fill: bodyColor, weight: 400, family: "sans-serif" })
    : "";

  const footerY = SIZE - 90;
  const footerSvg = opts.footer
    ? `<text x="${SIZE / 2}" y="${footerY}" font-size="24" font-family="sans-serif" font-weight="600" letter-spacing="2" fill="${GOLD}" text-anchor="middle">${escapeXml(opts.footer.toUpperCase())}</text>`
    : "";

  const logoSvg = logo
    ? `<image x="${SIZE / 2 - 45}" y="${SIZE - 210}" width="90" height="90" href="data:image/png;base64,${logo}" />`
    : "";

  const svg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="${bgDeep}" />
    </linearGradient>
    <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD_LIGHT}" />
      <stop offset="100%" stop-color="${GOLD}" />
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)" />
  <rect x="${margin}" y="${margin}" width="${contentWidth}" height="6" fill="url(#goldLine)" />
  ${eyebrowSvg}
  ${titleSvg}
  ${bodySvg}
  ${opts.footer ? `<rect x="${SIZE / 2 - 140}" y="${SIZE - 240}" width="280" height="2" fill="${GOLD}" opacity="0.5" />` : ""}
  ${logoSvg}
  ${footerSvg}
</svg>`.trim();

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function saveCard(buffer: Buffer, prefix: string): Promise<string> {
  await mkdir(GEN_ROOT, { recursive: true });
  const fileName = `${prefix}-${uuid()}.png`;
  await sharp(buffer).toFile(path.join(GEN_ROOT, fileName));
  return `/uploads/marketing/${fileName}`;
}

export interface CarouselSlideInput {
  title: string;
  body: string;
}

/**
 * Renderiza um card único (imagem 1080x1080) a partir de um título/gancho —
 * usado para post único de Instagram, Facebook e LinkedIn.
 */
export async function renderSocialPostImage(headline: string, area?: string): Promise<string> {
  const buffer = await renderCard({
    eyebrow: area,
    title: headline,
    footer: "Wilson Andrade Advocacia",
    variant: "dark",
  });
  return saveCard(buffer, "post");
}

/**
 * Renderiza cada tela de um carrossel como uma imagem 1080x1080 separada.
 */
export async function renderCarouselImages(slides: CarouselSlideInput[], area?: string): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const isCover = i === 0;
    const isClosing = i === slides.length - 1;
    const buffer = await renderCard({
      eyebrow: isCover ? area : `${i + 1}/${slides.length}`,
      title: slide.title,
      body: slide.body,
      footer: isClosing ? "Wilson Andrade Advocacia · OAB/AL 14.662" : undefined,
      variant: isCover || isClosing ? "dark" : i % 2 === 0 ? "light" : "dark",
    });
    paths.push(await saveCard(buffer, `carrossel-${i + 1}`));
  }
  return paths;
}
