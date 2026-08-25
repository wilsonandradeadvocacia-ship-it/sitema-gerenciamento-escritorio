import JSZip from "jszip";
import { readFile } from "fs/promises";

// Replaces {{placeholder}} tokens inside a .docx file's XML parts.
// Word frequently splits a single {{token}} across multiple <w:t> runs, so we
// first collapse any run of text nodes inside the same paragraph before
// applying replacements, operating directly on the raw XML string.
export async function mergeDocxPlaceholders(filePath: string, values: Record<string, string>): Promise<Buffer> {
  const buffer = await readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);

  const targets = ["word/document.xml", "word/header1.xml", "word/header2.xml", "word/header3.xml", "word/footer1.xml", "word/footer2.xml", "word/footer3.xml"];

  for (const target of targets) {
    const file = zip.file(target);
    if (!file) continue;
    let xml = await file.async("string");

    // Collapse "{{" "}}" split across separate <w:t> runs by stripping XML tags
    // only within runs of text that together might form a token — safe general
    // approach: remove tags between consecutive w:t contents when a "{{" appears
    // without a matching "}}" in the same <w:t>.
    xml = collapseSplitTokens(xml);

    for (const [key, value] of Object.entries(values)) {
      const pattern = new RegExp(`\\{\\{\\s*${escapeRegex(key)}\\s*\\}\\}`, "g");
      xml = xml.replace(pattern, escapeXml(value ?? ""));
    }

    zip.file(target, xml);
  }

  const out = await zip.generateAsync({ type: "nodebuffer" });
  return out;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Merges consecutive <w:t>...</w:t> runs (ignoring intervening run markup) when
// a "{{" opens without a "}}" closing in the same text node, by concatenating
// their text content and dropping the run boundaries between them.
function collapseSplitTokens(xml: string): string {
  const textNodeRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let match: RegExpExecArray | null;
  const nodes: { index: number; length: number; text: string }[] = [];
  while ((match = textNodeRegex.exec(xml))) {
    nodes.push({ index: match.index, length: match[0].length, text: match[1] });
  }
  if (nodes.length === 0) return xml;

  let result = xml;
  let offsetDelta = 0;
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.text.includes("{{") && !node.text.includes("}}")) {
      let j = i + 1;
      let combined = node.text;
      let endNode = node;
      while (j < nodes.length && !combined.includes("}}")) {
        combined += nodes[j].text;
        endNode = nodes[j];
        j++;
      }
      if (combined.includes("}}")) {
        const start = node.index + offsetDelta;
        const end = endNode.index + endNode.length + offsetDelta;
        const original = result.slice(start, end);
        const firstTag = original.match(/^<w:t(?:\s[^>]*)?>/)?.[0] ?? "<w:t>";
        const replacement = `${firstTag}${combined}</w:t>`;
        result = result.slice(0, start) + replacement + result.slice(end);
        offsetDelta += replacement.length - (end - start);
      }
      i = j;
    } else {
      i++;
    }
  }
  return result;
}
