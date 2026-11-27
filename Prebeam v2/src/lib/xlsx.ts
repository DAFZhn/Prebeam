/**
 * Escritor mínimo de libros de Excel (.xlsx, Office Open XML) sin dependencias.
 * Genera hojas con estilos, anchos de columna, celdas combinadas, paneles
 * inmovilizados y fórmulas, y empaqueta todo en un .zip (método "store").
 *
 * Uso:
 *   const bytes = buildXlsx([{ name: "Resumen", rows: [[{ v: "Título", s: "title" }]] }]);
 *   downloadXlsx(bytes, "archivo.xlsx");
 */

export type StyleName =
  | "default" | "title" | "muted" | "note" | "head" | "headGroup" | "band" | "label"
  | "text" | "textC" | "wrap" | "int" | "n1" | "n2" | "n3" | "n4"
  | "ok" | "fail" | "info" | "warn";

export type CellValue = string | number | boolean | null | undefined;
export interface CellObj { v?: CellValue; s?: StyleName; f?: string }
export type Cell = CellValue | CellObj;

export interface Sheet {
  name: string;
  rows: Cell[][];
  /** anchos de columna en caracteres */
  widths?: number[];
  /** rangos combinados, p. ej. "A1:F1" */
  merges?: string[];
  /** filas / columnas inmovilizadas */
  freeze?: { rows?: number; cols?: number };
  /** rango del autofiltro, p. ej. "A3:U20" */
  autoFilter?: string;
  /** alto de fila (puntos) por número de fila, base 1 */
  heights?: Record<number, number>;
  landscape?: boolean;
  tabColor?: string; // RRGGBB
}

export interface WorkbookMeta { title?: string; author?: string }

/* ------------------------------------------------------------------ */
/*  Estilos                                                            */
/* ------------------------------------------------------------------ */

const INK = "FF111310";
const FONTS = [
  '<font><sz val="11"/><color rgb="FF1B1D18"/><name val="Calibri"/><family val="2"/></font>', // 0 normal
  '<font><b/><sz val="11"/><color rgb="FF1B1D18"/><name val="Calibri"/><family val="2"/></font>', // 1 negrita
  '<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>', // 2 encabezado
  `<font><b/><sz val="18"/><color rgb="${INK}"/><name val="Calibri"/><family val="2"/></font>`, // 3 título
  '<font><i/><sz val="10"/><color rgb="FF5F6458"/><name val="Calibri"/><family val="2"/></font>', // 4 nota
  `<font><b/><sz val="11"/><color rgb="${INK}"/><name val="Calibri"/><family val="2"/></font>`, // 5 banda
  '<font><b/><sz val="11"/><color rgb="FF2F622C"/><name val="Calibri"/><family val="2"/></font>', // 6 ok
  '<font><b/><sz val="11"/><color rgb="FFA83215"/><name val="Calibri"/><family val="2"/></font>', // 7 fallo
  '<font><b/><sz val="11"/><color rgb="FF765B08"/><name val="Calibri"/><family val="2"/></font>', // 8 aviso
  '<font><b/><sz val="11"/><color rgb="FF455C18"/><name val="Calibri"/><family val="2"/></font>', // 9 info
];
const solid = (rgb: string) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${rgb}"/><bgColor indexed="64"/></patternFill></fill>`;
const FILLS = [
  '<fill><patternFill patternType="none"/></fill>', // 0 (obligatorio)
  '<fill><patternFill patternType="gray125"/></fill>', // 1 (obligatorio)
  solid("191C16"), // 2 encabezado oscuro
  solid("C7F36B"), // 3 lima
  solid("F1F1E9"), // 4 papel
  solid("E6F2DF"), // 5 ok
  solid("FFF0EB"), // 6 fallo
  solid("FFF6D9"), // 7 aviso
  solid("EEF6D9"), // 8 info
  solid("34382E"), // 9 grupo
];
const edge = (n: string) => `<${n} style="thin"><color rgb="FFC8CBBF"/></${n}>`;
const BORDERS = [
  "<border><left/><right/><top/><bottom/><diagonal/></border>",
  `<border>${edge("left")}${edge("right")}${edge("top")}${edge("bottom")}<diagonal/></border>`,
];
const NUMFMTS: [number, string][] = [[164, "0.0"], [165, "0.000"], [166, "0.0000"]];

interface Xf { fmt: number; font: number; fill: number; border: number; align?: string }
const XF: Record<StyleName, Xf> = {
  default: { fmt: 0, font: 0, fill: 0, border: 0, align: 'vertical="center"' },
  title: { fmt: 0, font: 3, fill: 0, border: 0, align: 'vertical="center"' },
  muted: { fmt: 0, font: 4, fill: 0, border: 0, align: 'vertical="center"' },
  note: { fmt: 0, font: 4, fill: 0, border: 0, align: 'vertical="top" wrapText="1"' },
  head: { fmt: 0, font: 2, fill: 2, border: 1, align: 'horizontal="center" vertical="center" wrapText="1"' },
  headGroup: { fmt: 0, font: 2, fill: 9, border: 1, align: 'horizontal="center" vertical="center"' },
  band: { fmt: 0, font: 5, fill: 3, border: 1, align: 'vertical="center"' },
  label: { fmt: 0, font: 1, fill: 4, border: 1, align: 'vertical="center"' },
  text: { fmt: 0, font: 0, fill: 0, border: 1, align: 'vertical="center"' },
  textC: { fmt: 0, font: 0, fill: 0, border: 1, align: 'horizontal="center" vertical="center"' },
  wrap: { fmt: 0, font: 0, fill: 0, border: 1, align: 'vertical="top" wrapText="1"' },
  int: { fmt: 1, font: 0, fill: 0, border: 1, align: 'vertical="center"' },
  n1: { fmt: 164, font: 0, fill: 0, border: 1, align: 'vertical="center"' },
  n2: { fmt: 2, font: 0, fill: 0, border: 1, align: 'vertical="center"' },
  n3: { fmt: 165, font: 0, fill: 0, border: 1, align: 'vertical="center"' },
  n4: { fmt: 166, font: 0, fill: 0, border: 1, align: 'vertical="center"' },
  ok: { fmt: 0, font: 6, fill: 5, border: 1, align: 'horizontal="center" vertical="center"' },
  fail: { fmt: 0, font: 7, fill: 6, border: 1, align: 'horizontal="center" vertical="center"' },
  info: { fmt: 0, font: 9, fill: 8, border: 1, align: 'horizontal="center" vertical="center"' },
  warn: { fmt: 0, font: 8, fill: 7, border: 1, align: 'horizontal="center" vertical="center"' },
};
const STYLE_ORDER = Object.keys(XF) as StyleName[];
const styleId = (s: StyleName | undefined) => Math.max(0, STYLE_ORDER.indexOf(s ?? "default"));

function stylesXml(): string {
  const xfs = STYLE_ORDER.map((k) => {
    const x = XF[k];
    return `<xf numFmtId="${x.fmt}" fontId="${x.font}" fillId="${x.fill}" borderId="${x.border}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment ${x.align ?? ""}/></xf>`;
  });
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<numFmts count="${NUMFMTS.length}">${NUMFMTS.map(([id, c]) => `<numFmt numFmtId="${id}" formatCode="${c}"/>`).join("")}</numFmts>` +
    `<fonts count="${FONTS.length}">${FONTS.join("")}</fonts>` +
    `<fills count="${FILLS.length}">${FILLS.join("")}</fills>` +
    `<borders count="${BORDERS.length}">${BORDERS.join("")}</borders>` +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    `<cellXfs count="${xfs.length}">${xfs.join("")}</cellXfs>` +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    "</styleSheet>"
  );
}

/* ------------------------------------------------------------------ */
/*  Hojas                                                              */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line no-control-regex
const BAD_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;
const esc = (s: string) =>
  s.replace(BAD_XML, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function colName(i: number): string {
  let n = i + 1;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function cellXml(c: Cell, r: number, col: number): string {
  const obj: CellObj = typeof c === "object" && c !== null ? c : { v: c };
  const ref = `${colName(col)}${r}`;
  const s = obj.s ? ` s="${styleId(obj.s)}"` : "";
  let v = obj.v;
  if (typeof v === "number" && !isFinite(v)) v = Number.isNaN(v) ? null : v > 0 ? "∞" : "-∞";
  if (obj.f) {
    const cached = typeof v === "number" ? `<v>${v}</v>` : "";
    return `<c r="${ref}"${s}><f>${esc(obj.f)}</f>${cached}</c>`;
  }
  if (v === null || v === undefined || v === "") return obj.s ? `<c r="${ref}"${s}/>` : "";
  if (typeof v === "number") return `<c r="${ref}"${s}><v>${v}</v></c>`;
  if (typeof v === "boolean") return `<c r="${ref}"${s} t="b"><v>${v ? 1 : 0}</v></c>`;
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
}

function sheetXml(sh: Sheet): string {
  const nRows = sh.rows.length;
  const nCols = Math.max(1, ...sh.rows.map((r) => r.length), sh.widths?.length ?? 0);
  const rows = sh.rows
    .map((row, i) => {
      const r = i + 1;
      const h = sh.heights?.[r];
      const cells = row.map((c, j) => cellXml(c, r, j)).join("");
      return `<row r="${r}"${h ? ` ht="${h}" customHeight="1"` : ""}>${cells}</row>`;
    })
    .join("");

  const fr = sh.freeze?.rows ?? 0;
  const fc = sh.freeze?.cols ?? 0;
  let pane = "";
  if (fr || fc) {
    const active = fr && fc ? "bottomRight" : fr ? "bottomLeft" : "topRight";
    pane =
      `<pane${fc ? ` xSplit="${fc}"` : ""}${fr ? ` ySplit="${fr}"` : ""} topLeftCell="${colName(fc)}${fr + 1}" activePane="${active}" state="frozen"/>` +
      `<selection pane="${active}" activeCell="${colName(fc)}${fr + 1}" sqref="${colName(fc)}${fr + 1}"/>`;
  }
  const cols = sh.widths?.length
    ? `<cols>${sh.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const merges = sh.merges?.length ? `<mergeCells count="${sh.merges.length}">${sh.merges.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>` : "";
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheetPr>${sh.tabColor ? `<tabColor rgb="FF${sh.tabColor}"/>` : ""}<pageSetUpPr fitToPage="1"/></sheetPr>` +
    `<dimension ref="A1:${colName(nCols - 1)}${Math.max(1, nRows)}"/>` +
    `<sheetViews><sheetView workbookViewId="0" showGridLines="0">${pane}</sheetView></sheetViews>` +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    cols +
    `<sheetData>${rows}</sheetData>` +
    (sh.autoFilter ? `<autoFilter ref="${sh.autoFilter}"/>` : "") +
    merges +
    '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
    `<pageSetup orientation="${sh.landscape === false ? "portrait" : "landscape"}" fitToWidth="1" fitToHeight="0"/>` +
    "</worksheet>"
  );
}

/** Nombre de hoja válido para Excel: sin []:*?/\ y de hasta 31 caracteres, único */
function sheetNames(sheets: Sheet[]): string[] {
  const used = new Set<string>();
  return sheets.map((s, i) => {
    let n = s.name.replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31) || `Hoja ${i + 1}`;
    let k = 2;
    const base = n;
    while (used.has(n.toLowerCase())) n = `${base.slice(0, 28)} ${k++}`;
    used.add(n.toLowerCase());
    return n;
  });
}

/* ------------------------------------------------------------------ */
/*  ZIP (método store) + CRC-32                                        */
/* ------------------------------------------------------------------ */

let CRC_TABLE: Uint32Array | null = null;
function crc32(data: Uint8Array): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function zipStore(files: { name: string; data: Uint8Array }[], when = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const time = (when.getHours() << 11) | (when.getMinutes() << 5) | (when.getSeconds() >> 1);
  const date = ((Math.max(1980, when.getFullYear()) - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // nombres en UTF-8
    lh.setUint16(8, 0, true); // sin compresión
    lh.setUint16(10, time, true);
    lh.setUint16(12, date, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, f.data.length, true);
    lh.setUint32(22, f.data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, time, true);
    ch.setUint16(14, date, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, f.data.length, true);
    ch.setUint32(24, f.data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + f.data.length;
  }
  const cdSize = central.reduce((a, p) => a + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of all) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Libro                                                              */
/* ------------------------------------------------------------------ */

export function buildXlsx(sheets: Sheet[], meta: WorkbookMeta = {}): Uint8Array {
  if (!sheets.length) throw new Error("El libro necesita al menos una hoja.");
  const enc = new TextEncoder();
  const names = sheetNames(sheets);
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const NS_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
  const OD = "http://schemas.openxmlformats.org/officeDocument/2006";
  const iso = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  const contentTypes =
    X +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
    "</Types>";
  const rootRels =
    X +
    `<Relationships xmlns="${NS_REL}">` +
    `<Relationship Id="rId1" Type="${OD}/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    `<Relationship Id="rId3" Type="${OD}/relationships/extended-properties" Target="docProps/app.xml"/>` +
    "</Relationships>";
  const workbook =
    X +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${OD}/relationships">` +
    '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="16000"/></bookViews>' +
    `<sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
    "</workbook>";
  const wbRels =
    X +
    `<Relationships xmlns="${NS_REL}">` +
    sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${OD}/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
    `<Relationship Id="rId${sheets.length + 1}" Type="${OD}/relationships/styles" Target="styles.xml"/>` +
    "</Relationships>";
  const core =
    X +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    `<dc:title>${esc(meta.title ?? "PreBeam")}</dc:title>` +
    `<dc:creator>${esc(meta.author || "PreBeam")}</dc:creator>` +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created>` +
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>` +
    "</cp:coreProperties>";
  const app =
    X +
    `<Properties xmlns="${OD}/extended-properties"><Application>PreBeam</Application></Properties>`;

  const files = [
    { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
    { name: "_rels/.rels", data: enc.encode(rootRels) },
    { name: "xl/workbook.xml", data: enc.encode(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(wbRels) },
    { name: "xl/styles.xml", data: enc.encode(stylesXml()) },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: enc.encode(sheetXml(s)) })),
    { name: "docProps/core.xml", data: enc.encode(core) },
    { name: "docProps/app.xml", data: enc.encode(app) },
  ];
  return zipStore(files);
}

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Descarga el libro en el navegador. Devuelve el nombre de archivo usado. */
export function downloadXlsx(bytes: Uint8Array, filename: string): string {
  const name = /\.xlsx$/i.test(filename) ? filename : `${filename}.xlsx`;
  const blob = new Blob([bytes as BlobPart], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return name;
}

/** Nombre de archivo seguro: sin acentos ni caracteres reservados */
export function safeFileName(...parts: (string | undefined)[]): string {
  const s = parts
    .filter((p): p is string => !!p && p.trim() !== "")
    .join("_")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return s || "prebeam";
}
