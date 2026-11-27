import type { Status } from "./calc";
import { colName, type Cell, type Sheet, type StyleName } from "./xlsx";

export const statusText: Record<Status, string> = { ok: "Cumple", min: "Av,mín", none: "No requiere", fail: "No cumple" };
export const statusCell = (s: Status): Cell => ({ v: statusText[s], s: s === "ok" ? "ok" : s === "fail" ? "fail" : "info" });
export const flexStatusCell = (s: "ok" | "fail" | "none"): Cell =>
  s === "none" ? { v: "—", s: "textC" } : { v: s === "ok" ? "Cumple" : "No cumple", s: s === "ok" ? "ok" : "fail" };

export const yesNo = (b: boolean) => (b ? "Sí" : "No");
export const dateLong = () => new Date().toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" });
export const dash: Cell = { v: "—", s: "textC" };

/** Número con formato; los valores no positivos se muestran como «—» cuando `dashZero` */
export const num = (v: number, s: StyleName = "n2", dashZero = false): Cell => (dashZero && !(v > 0) ? dash : { v, s });

/**
 * Constructor de hojas: lleva la cuenta de filas y de celdas combinadas
 * para que cada herramienta describa su hoja sin calcular referencias a mano.
 */
export class SheetBuilder {
  rows: Cell[][] = [];
  merges: string[] = [];
  heights: Record<number, number> = {};

  cols: number;

  constructor(cols: number) {
    this.cols = cols;
  }

  /** número de la siguiente fila (base 1) */
  get next() {
    return this.rows.length + 1;
  }

  add(row: Cell[]): number {
    this.rows.push(row);
    return this.rows.length;
  }

  blank() {
    this.rows.push([]);
  }

  private mergeRow(r: number, from = 0, to = this.cols - 1) {
    if (to > from) this.merges.push(`${colName(from)}${r}:${colName(to)}${r}`);
  }

  title(text: string) {
    const r = this.add([{ v: text, s: "title" }]);
    this.mergeRow(r);
    this.heights[r] = 30;
  }

  muted(text: string) {
    const r = this.add([{ v: text, s: "muted" }]);
    this.mergeRow(r);
  }

  /** nota de varias líneas combinada en todo el ancho */
  note(text: string, charsPerLine = this.cols * 14) {
    const r = this.add([{ v: text, s: "note" }]);
    this.mergeRow(r);
    this.heights[r] = 14 * Math.max(1, Math.ceil(text.length / charsPerLine)) + 2;
  }

  band(text: string) {
    const r = this.add([{ v: text, s: "band" }, ...Array.from({ length: this.cols - 1 }, () => ({ v: "", s: "band" as StyleName }))]);
    this.mergeRow(r);
    this.heights[r] = 20;
  }

  head(...labels: string[]): number {
    return this.add(labels.map((v) => ({ v, s: "head" as StyleName })));
  }

  /** fila «variable | valor | unidad | nota» */
  kv(label: string, value: Cell, unit = "", note = ""): number {
    return this.add([{ v: label, s: "label" }, value, { v: unit, s: "text" }, { v: note, s: "text" }]);
  }

  toSheet(name: string, extra: Partial<Sheet> = {}): Sheet {
    return { name, rows: this.rows, merges: this.merges, heights: this.heights, ...extra };
  }
}
