import { STIRRUP_BARS, STRAND_TYPES, strandArea } from "../../lib/calc";
import { dash, dateLong, flexStatusCell, num, SheetBuilder, statusCell, yesNo } from "../../lib/excelCommon";
import { buildXlsx, colName, downloadXlsx, safeFileName, type Cell, type Sheet } from "../../lib/xlsx";
import type { ContinuousInputs, ContinuousResult, EndCond } from "./engine";
import { nodeName } from "./format";

const END: Record<EndCond, string> = { pinned: "Articulado / apoyo simple", fixed: "Empotrado", free: "Libre (voladizo)" };
const KIND = { apoyo: "Apoyo", empotramiento: "Empotramiento", libre: "Extremo libre" } as const;
const CRITICAL = { "d/2": "d/2", "h/2": "h/2 (pretensado, ACI 9.4.3.2)", d: "d" } as const;

/** Hojas del libro de Excel para la herramienta de viga continua (puro, sin DOM) */
export function buildContinuousSheets(inp: ContinuousInputs, res: ContinuousResult): Sheet[] {
  const norma = inp.code === "318-19" ? "ACI 318-19" : "ACI 318-99";
  const n = inp.spans.length;
  const maxR = res.nodes.reduce((a, b) => (b.Rmax > a.Rmax ? b : a), res.nodes[0]);

  /* ---------- Resumen ---------- */
  const s1 = new SheetBuilder(4);
  s1.title("PreBeam · Viga continua pretensada");
  s1.muted("Memoria exportada desde PreBeam. Herramienta de apoyo: los resultados deben ser revisados por el ingeniero responsable.");
  s1.blank();
  s1.band("Proyecto");
  s1.kv("Proyecto", inp.project || "—");
  s1.kv("Elemento", inp.element || "—");
  s1.kv("Calculó", inp.author || "—");
  s1.kv("Fecha", dateLong());
  s1.kv("Norma", norma);
  s1.kv("Unidades", "kip · ft · in · psi · ksi");
  s1.kv("Modelo", `${n} tramo${n > 1 ? "s" : ""} · ${res.total.toFixed(2)} ft`, "", `extremos: ${END[inp.leftEnd].toLowerCase()} / ${END[inp.rightEnd].toLowerCase()} · ${inp.pattern ? "alternancia de carga viva" : "carga viva simultánea"}`);
  s1.blank();
  s1.band("Estado del diseño");
  s1.kv(
    "Verificación",
    { v: res.allOk ? "CUMPLE" : "NO CUMPLE", s: res.allOk ? "ok" : "fail" },
    "",
    res.allOk ? `${res.stirrupsTotal} estribos en la viga` : `cortante: ${res.failShear} sección(es) · flexión: ${res.failFlex} sección(es)`
  );
  s1.blank();
  s1.band("Resultados generales");
  s1.head("Parámetro", "Valor", "Unidad", "Nota");
  s1.kv("Vu máximo", num(res.VuMax), "kip", `${inp.gD}·D + ${inp.gL}·L`);
  s1.kv("Mu+ máximo", num(res.MuPosMax), "kip·ft", `φMn+ = ${res.flex.phiMnPos.toFixed(1)} kip·ft`);
  s1.kv("Mu− máximo", num(res.MuNegMax), "kip·ft", `φMn− = ${res.flex.phiMnNeg.toFixed(1)} kip·ft`);
  s1.kv("Reacción máxima Ru", num(maxR.Rmax), "kip", `en el nodo ${nodeName(maxR.index)}`);
  s1.kv("Ap torones", num(res.ctx.Ap, "n3"), "in²", `fps = ${res.flex.fps.toFixed(1)} ksi`);
  s1.kv("Av estribos", num(res.ctx.Av), "in²", `${inp.stirrupBar} × ${inp.legs} ramales`);
  s1.kv("S máx que rige", num(res.ctx.restr.governing), "in", res.ctx.restr.governingLabel);
  s1.kv("Estribos en toda la viga", { v: res.stirrupsTotal, s: "int" });
  s1.kv("Secciones que no cumplen (cortante)", { v: res.failShear, s: res.failShear ? "fail" : "int" });
  s1.kv("Secciones que no cumplen (flexión)", { v: res.failFlex, s: res.failFlex ? "fail" : "int" });
  s1.blank();
  s1.band("Advertencias");
  if (res.warnings.length) res.warnings.forEach((w) => s1.note(w, 70));
  else s1.note("Sin advertencias.");

  /* ---------- Datos de entrada ---------- */
  const s2 = new SheetBuilder(5);
  s2.title("Datos de entrada");
  s2.muted("Valores ingresados en PreBeam para este cálculo. Las cargas son de servicio; wD incluye el peso propio.");
  s2.blank();
  const put = (label: string, v: Cell, unit = "", note = "") => s2.kv(label, typeof v === "number" || typeof v === "string" ? { v, s: "text" } : v, unit, note);
  s2.band("Modelo estructural");
  s2.head("Tramo", "Luz L (ft)", "EI relativo", "w muerta (kip/ft)", "w viva (kip/ft)");
  inp.spans.forEach((s, i) => s2.add([{ v: `Tramo ${i + 1}`, s: "label" }, { v: s.L, s: "text" }, { v: s.EIrel, s: "text" }, { v: s.wD, s: "text" }, { v: s.wL, s: "text" }]));
  s2.blank();
  s2.head("Variable", "Valor", "Unidad", "Descripción", "");
  put("Extremo izquierdo", END[inp.leftEnd]);
  put("Extremo derecho", END[inp.rightEnd]);
  put("Alternancia de carga viva", yesNo(inp.pattern), "", "envolvente cargando y descargando tramos");
  if (inp.points.length) {
    s2.blank();
    s2.band("Cargas puntuales");
    s2.head("Carga", "Tramo", "Tipo", "Posición a (ft)", "P (kip)");
    inp.points.forEach((p, i) => s2.add([{ v: `P${i + 1}`, s: "label" }, { v: `Tramo ${p.span + 1}`, s: "text" }, { v: p.kind === "D" ? "Muerta (D)" : "Viva (L)", s: "text" }, { v: p.a, s: "text" }, { v: p.P, s: "text" }]));
  }
  s2.blank();
  s2.band("Proyecto");
  s2.head("Variable", "Valor", "Unidad", "Descripción", "");
  put("Proyecto", inp.project || "—");
  put("Elemento", inp.element || "—");
  put("Calculó", inp.author || "—");
  s2.blank();
  s2.band("Norma y materiales");
  put("Norma", norma);
  put("φ cortante", inp.phi);
  put("γD", inp.gD, "", "factor de carga muerta");
  put("γL", inp.gL, "", "factor de carga viva");
  put("f'c", inp.fc, "psi");
  put("λ", inp.lambda, "", "1.0 = concreto de peso normal");
  put("fy estribos", inp.fy, "ksi");
  put("fy longitudinal", inp.fyL, "ksi", "acero ordinario");
  put("fpu torones", inp.fpu, "ksi");
  put("fse efectivo", inp.fse, "ksi", "pretensado efectivo");
  s2.blank();
  s2.band("Sección para cortante");
  put("Altura H", inp.h, "in");
  put("Ancho del alma bw", inp.bw, "in");
  put("Peralte d ingresado", inp.d, "in");
  put("Peralte d usado", num(res.ctx.dReal), "in", "máx(d, 0.8H)");
  put("Ancho de apoyo", inp.supportWidth, "in", "la sección crítica se mide desde la cara del apoyo");
  put("Sección crítica", CRITICAL[inp.critical]);
  put("Paso entre secciones", inp.step, "ft");
  put("Redondeo de S", inp.rounding, "in");
  put("Reducir S máx a la mitad si Vs > 4√f'c·bw·d", yesNo(inp.halveSpacing));
  s2.blank();
  s2.band("Pretensado y estribos");
  inp.strands.forEach((s, i) => put(`Torón ${i + 1}`, { v: s.qty, s: "text" }, "torones", `${STRAND_TYPES[s.type]?.label ?? s.type} · ${STRAND_TYPES[s.type]?.area ?? 0} in² c/u`));
  put("Ap total", num(strandArea(inp.strands), "n3"), "in²");
  put("Barra de estribo", STIRRUP_BARS[inp.stirrupBar]?.label ?? inp.stirrupBar);
  put("Ramales", inp.legs);
  put("Av", num(res.ctx.Av), "in²", "área × ramales");
  s2.blank();
  s2.band("Flexión positiva");
  put("φ flexión máx.", inp.phiF);
  put("bf (ancho de compresión)", inp.bf, "in");
  put("hf (espesor del ala)", inp.hf, "in");
  put("dp (peralte a los torones)", inp.dp, "in");
  put("As inferior ordinario", inp.asBot, "in²");
  s2.blank();
  s2.band("Flexión negativa");
  put("As superior ordinario", inp.asTop, "in²");
  put("d negativo", inp.dNeg, "in", "de la fibra inferior al acero superior");
  put("b negativo", inp.bNeg, "in", "ancho de compresión (patín inferior)");

  /* ---------- Tabla de diseño ---------- */
  const COLS = 19;
  const s3 = new SheetBuilder(COLS);
  s3.title("Tabla de cortante y flexión");
  s3.muted("Vu con el momento concurrente (para Vc), separación de estribos y demanda/capacidad a flexión en cada sección. Unidades: kip, kip·ft, ft, in.");
  const groups: [string, number][] = [["Sección", 3], ["Cortante de diseño", 3], ["Resistencia (kip)", 2], ["Separación de estribos (in)", 3], ["Verificación cortante", 2], ["Flexión (kip·ft)", 5], ["Observación", 1]];
  const gRow = s3.next;
  let c = 0;
  const gCells: Cell[] = [];
  groups.forEach(([label, span]) => {
    for (let k = 0; k < span; k++) gCells.push({ v: k === 0 ? label : "", s: "headGroup" });
    if (span > 1) s3.merges.push(`${colName(c)}${gRow}:${colName(c + span - 1)}${gRow}`);
    c += span;
  });
  s3.add(gCells);
  s3.head("Tramo", "x (ft)", "X global (ft)", "Vu (kip)", "Mu conc.", "Vu·d/Mu", "φVc útil", "φVs", "S teórico", "S máx", "S real", "D/C", "Estado", "Mu+", "Mu−", "D/C +", "D/C −", "Estado", "");
  s3.heights[s3.next - 1] = 30;
  res.rows.forEach((r, i) => {
    const s = r.shear;
    const first = i === 0 || res.rows[i - 1].span !== r.span;
    const obs = [r.isSupport ? "Apoyo" : "", r.isCritical ? "Sección crítica" : "", r.isLoad ? "Carga puntual" : "", r.clamped ? `Vu tomado en x = ${r.xEval.toFixed(2)} ft` : "", s.halved ? "S máx ÷ 2" : ""].filter(Boolean).join(" · ");
    s3.add([
      first ? { v: r.span + 1, s: "label" } : { v: "", s: "label" }, { v: r.x, s: "label" }, num(r.X),
      num(Math.abs(r.Vu)), num(r.Mc), num(s.ratio, "n3"), num(s.phiVcUtil), num(s.phiVs),
      num(s.sTheo, "n2", true), num(s.sMax), s.sReal > 0 ? { v: s.sReal, s: "n2" } : dash,
      s.dc > 0 ? num(s.dc, "n3") : dash, statusCell(s.status),
      r.MuPos > 0 ? num(r.MuPos) : dash, r.MuNeg < -1e-3 ? num(r.MuNeg) : dash,
      r.dcPos > 0 ? num(r.dcPos, "n3") : dash, r.dcNeg > 0 ? num(r.dcNeg, "n3") : dash, flexStatusCell(r.flexStatus),
      { v: obs, s: "text" },
    ]);
  });
  const lastData = s3.next - 1;
  s3.blank();
  s3.note("Vu: cortante máximo en valor absoluto de la envolvente · Mu conc.: |Mu| que actúa con ese cortante · entre el eje del apoyo y la sección crítica se diseña con el Vu de la sección crítica · Mu+ / Mu−: envolvente de flexión en la sección.", 200);

  /* ---------- Nodos y apoyos ---------- */
  const s4 = new SheetBuilder(12);
  s4.title("Reacciones y momentos en los nodos");
  s4.muted(`Reacciones en kip, momentos en kip·ft. Ru = ${inp.gD}·D + ${inp.gL}·L. As req. es el acero superior que pide el momento negativo del nodo (φ = ${inp.phiF}) frente al As superior provisto (${inp.asTop} in²).`);
  s4.blank();
  s4.head("Nodo", "X (ft)", "Tipo", "R muerta", "R viva (total)", "Ru máx", "Ru mín", "Mu− nodo", "Mu+ nodo", "As req. (in²)", "As prov. (in²)", "As req./prov.");
  s4.heights[s4.next - 1] = 30;
  res.nodes.forEach((nd) => {
    const free = nd.kind === "libre";
    const asCell: Cell = nd.asDc === null ? dash : nd.asReq === null ? { v: "sección insuf.", s: "fail" } : num(nd.asReq);
    s4.add([
      { v: nodeName(nd.index), s: "label" }, num(nd.X), { v: KIND[nd.kind], s: "text" },
      free ? dash : num(nd.RD), free ? dash : num(nd.RL), free ? dash : num(nd.Rmax), free ? dash : { v: nd.Rmin, s: nd.Rmin < -1e-6 ? "warn" : "n2" },
      free ? dash : num(nd.Mmin), free ? dash : num(nd.Mmax),
      asCell, nd.asDc === null ? dash : num(inp.asTop), nd.asDc === null ? dash : { v: nd.asDc, s: nd.asDc > 1.0001 ? "fail" : "n3" },
    ]);
  });

  /* ---------- Armado ---------- */
  const s5 = new SheetBuilder(6);
  s5.title("Distribución de estribos y capacidad a flexión");
  s5.muted(`Estribos ${inp.stirrupBar} de ${inp.legs} ramales (Av = ${res.ctx.Av.toFixed(2)} in²). En cada intervalo rige la menor separación de sus dos extremos.`);
  s5.blank();
  s5.band("Zonas de estribos por tramo");
  s5.head("Tramo", "De x (ft)", "A x (ft)", "Longitud (ft)", "S (in)", "Estribos");
  const z0 = s5.next;
  res.zones.forEach((z, i) => {
    const first = i === 0 || res.zones[i - 1].span !== z.span;
    s5.add([{ v: first ? z.span + 1 : "", s: "label" }, num(z.from), num(z.to), num(z.to - z.from), z.s > 0 ? { v: z.s, s: "n2" } : dash, z.count > 0 ? { v: z.count, s: "int" } : dash]);
  });
  const z1 = s5.next - 1;
  s5.add([{ v: "Total en la viga", s: "label" }, { v: "", s: "text" }, { v: "", s: "text" }, { v: "", s: "text" }, { v: "", s: "text" }, { v: res.stirrupsTotal, s: "int", f: z1 >= z0 ? `SUM(F${z0}:F${z1})` : "0" }]);
  s5.blank();
  s5.band("Capacidad a flexión (constante en toda la viga)");
  s5.head("Concepto", "Valor", "Unidad", "", "", "");
  const f = res.flex;
  const flexRows: [string, number, string, string][] = [
    ["β1", f.beta1, "", "n2"], ["fps (torones)", f.fps, "ksi", "n1"],
    ["Positivo · a", f.aPos, "in", "n2"], ["Positivo · εt", f.epsPos, "", "n4"], ["Positivo · φ", f.phiPos, "", "n2"], ["Positivo · φMn+", f.phiMnPos, "kip·ft", "n1"],
    ["Negativo · a", f.aNeg, "in", "n2"], ["Negativo · εt", f.epsNeg, "", "n4"], ["Negativo · φ", f.phiNeg, "", "n2"], ["Negativo · φMn−", f.phiMnNeg, "kip·ft", "n1"],
  ];
  flexRows.forEach(([label, v, unit, st]) => s5.add([{ v: label, s: "label" }, { v, s: st as "n1" }, { v: unit, s: "text" }]));
  s5.blank();
  s5.band("Restricciones de separación máxima S máx");
  s5.head("Restricción", "", "", "Valor (in)", "Rige", "");
  const r = res.ctx.restr;
  const items: [string, number][] = [
    ["d / 2", r.dHalf], ["Distancia máxima: 24 in", r.distance], ["0.75 · H", r.threeQuarterH],
    [inp.code === "318-19" ? "Av,mín = máx(0.75√f'c, 50)·bw·s/fy" : "Av,mín = 50·bw·s/fy", r.minAv50],
    ["Av,mín pretensado: 80·Av·fy·d / (fpu·√(d/bw)·Ap)", r.minAvPS],
  ];
  items.forEach(([label, v]) => {
    const rr = s5.add([{ v: label, s: "label" }, { v: "", s: "label" }, { v: "", s: "label" }, isFinite(v) ? num(v) : dash, Math.abs(v - r.governing) < 1e-9 ? { v: "Rige", s: "warn" } : { v: "", s: "text" }, { v: "", s: "text" }]);
    s5.merges.push(`A${rr}:C${rr}`);
  });

  /* ---------- Envolventes ---------- */
  const s6 = new SheetBuilder(5);
  s6.title("Envolventes de cortante y momento");
  s6.muted("Valores últimos a lo largo de la viga, útiles para graficar. Positivo = tracción en la fibra inferior.");
  s6.blank();
  s6.head("X (ft)", "Vu máx (kip)", "Vu mín (kip)", "Mu+ máx (kip·ft)", "Mu− mín (kip·ft)");
  res.dense.forEach((p) => s6.add([{ v: p.X, s: "label" }, num(p.Vpos, "n3"), num(p.Vneg, "n3"), num(p.Mpos, "n3"), num(p.Mneg, "n3")]));
  const e1 = s6.next - 1;

  return [
    s1.toSheet("Resumen", { widths: [38, 24, 12, 56], tabColor: "C7F36B" }),
    s2.toSheet("Datos de entrada", { widths: [44, 24, 14, 24, 24], tabColor: "111310" }),
    s3.toSheet("Tabla de diseño", { widths: [8, 10, 12, 11, 11, 10, 11, 10, 11, 10, 10, 9, 13, 11, 11, 9, 9, 13, 34], freeze: { rows: 4, cols: 3 }, autoFilter: `A4:${colName(COLS - 1)}${lastData}`, tabColor: "C7F36B" }),
    s4.toSheet("Nodos y apoyos", { widths: [10, 11, 16, 12, 14, 12, 12, 13, 13, 14, 14, 14], tabColor: "111310" }),
    s5.toSheet("Armado", { widths: [34, 14, 14, 16, 14, 12], tabColor: "C7F36B" }),
    s6.toSheet("Envolventes", { widths: [12, 16, 16, 18, 18], freeze: { rows: 4 }, autoFilter: `A4:E${e1}`, tabColor: "111310" }),
  ];
}

/** Genera y descarga el libro; devuelve el nombre del archivo */
export function exportContinuousXlsx(inp: ContinuousInputs, res: ContinuousResult): string {
  const bytes = buildXlsx(buildContinuousSheets(inp, res), { title: `PreBeam · ${inp.project || "Viga continua"}`, author: inp.author });
  return downloadXlsx(bytes, safeFileName(inp.project, inp.element, "viga_continua") + ".xlsx");
}
