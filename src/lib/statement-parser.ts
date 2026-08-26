export interface ParsedTx {
  date: Date;
  description: string;
  amount: number;
}

// Handles both Brazilian ("1.234,56" or "1234,56") and plain/US ("1234.56")
// numeric formats, since bank exports vary. The decimal separator is
// whichever of "," or "." appears LAST in the string (closest to the end);
// any earlier occurrences of the other symbol are thousands separators and
// are stripped.
function parseBRNumber(raw: string): number {
  const trimmed = raw.trim().replace(/[^\d.,-]/g, "");
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");
  let cleaned: string;
  if (lastComma > lastDot) {
    cleaned = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    cleaned = trimmed.replace(/,/g, "");
  } else {
    cleaned = trimmed;
  }
  return parseFloat(cleaned);
}

export function parseCSV(text: string): ParsedTx[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const results: ParsedTx[] = [];
  for (const line of lines) {
    const sep = line.includes(";") ? ";" : ",";
    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 3) continue;
    const [dateStr, description, amountStr] = cols;
    const date = parseDateFlexible(dateStr);
    const amount = parseBRNumber(amountStr);
    if (date && !isNaN(amount)) results.push({ date, description: description || "Lançamento", amount });
  }
  return results;
}

export function parseOFX(text: string): ParsedTx[] {
  const results: ParsedTx[] = [];
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  for (const block of blocks) {
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/i);
    const amountMatch = block.match(/<TRNAMT>(-?[\d.]+)/i);
    const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i) || block.match(/<NAME>([^<\r\n]+)/i);
    if (dateMatch && amountMatch) {
      const d = dateMatch[1];
      const date = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`);
      results.push({
        date,
        description: memoMatch?.[1]?.trim() || "Lançamento OFX",
        amount: parseFloat(amountMatch[1]),
      });
    }
  }
  return results;
}

function parseDateFlexible(raw: string): Date | null {
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(raw);
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return new Date(`${br[3]}-${br[2]}-${br[1]}`);
  return null;
}

// Heuristic parser for text extracted from a PDF bank statement:
// looks for lines containing a date (dd/mm/yyyy) and a currency value.
export function parseStatementText(text: string): ParsedTx[] {
  const results: ParsedTx[] = [];
  const lines = text.split(/\r?\n/);
  const lineRegex = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?R?\$?\s?-?[\d.,]+)\s*$/;
  for (const line of lines) {
    const match = line.match(lineRegex);
    if (!match) continue;
    const date = parseDateFlexible(match[1]);
    const amount = parseBRNumber(match[3]);
    if (date && !isNaN(amount) && Math.abs(amount) > 0) {
      results.push({ date, description: match[2].trim().slice(0, 200), amount });
    }
  }
  return results;
}
