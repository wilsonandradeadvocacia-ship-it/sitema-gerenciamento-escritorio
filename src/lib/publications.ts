// Tipos e utilitários compartilhados entre os provedores de busca automática
// de publicações (src/lib/escavador.ts e src/lib/djen.ts).

export interface FetchedPublication {
  tribunal: string;
  instance?: string;
  content: string;
  processNumber?: string;
  date?: string;
}

/** Aceita formatos como "OAB/AL 14.662", "AL 14662", "14662/AL", "14.662-AL". */
export function parseOab(oab: string): { numero: string; uf: string } | null {
  const match = oab.toUpperCase().match(/([A-Z]{2}).{0,5}?(\d[\d.]{3,})|(\d[\d.]{3,}).{0,5}?([A-Z]{2})/);
  if (!match) return null;
  const uf = match[1] || match[4];
  const numero = (match[2] || match[3])?.replace(/\D/g, "");
  if (!uf || !numero) return null;
  return { numero, uf };
}
