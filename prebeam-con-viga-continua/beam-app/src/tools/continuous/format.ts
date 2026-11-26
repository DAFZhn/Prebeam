/** Formato numérico sin «-0.00» */
export function f2(n: number, d = 2): string {
  if (!isFinite(n)) return "∞";
  const s = n.toFixed(d);
  return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s;
}

/** Nombre del nodo: A, B, C… */
export const nodeName = (j: number) => String.fromCharCode(65 + j);
