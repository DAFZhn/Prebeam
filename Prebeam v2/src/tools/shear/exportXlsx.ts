import { STIRRUP_BARS, STRAND_TYPES, strandArea, type Inputs, type Result } from "../../lib/calc";
import { dash, dateLong, num, SheetBuilder, statusCell, yesNo } from "../../lib/excelCommon";
import { buildXlsx, colName, downloadXlsx, safeFileName, type Cell, type Sheet } from "../../lib/xlsx";

const CRITICAL: Record<Inputs["critical"], string> = { "d/2": "x = d/2 (como la hoja)", "h/2": "x = h/2 (ACI 9.4.3.2)", d: "x = d" };

/** Hojas del libro de Excel para la herramienta de cortante en viga simplemente apoyada (puro, sin DOM) */
export function buildShearSheets(inp: Inputs, res: Result): Sheet[] {
  const norma = inp.code === "318-19" ? "ACI 318-19" : "ACI 318-99";

  /* ---------- Resumen ---------- */
  const s1 = new SheetBuilder(4);
  s1.title("PreBeam · Cortante vertical en viga pretensada");
  s1.muted("Memoria exportada desde PreBeam. Herramienta de apoyo: los resultados deben ser revisados por el ingeniero responsable.");
  s1.blank();
  s1.band("Proyecto");
  s1.kv("Proyecto", inp.project || "—");
  s1.kv("Elemento", inp.element || "—");
  s1.kv("Calculó", inp.author || "—");
  s1.kv("Fecha", dateLong());
  s1.kv("Norma", norma, "", inp.code === "318-19" ? "φ = 0.75 · 1.2D + 1.6L por defecto" : "φ = 0.85 · 1.4D + 1.7L por defecto");
  s1.kv("Unidades", "kip · ft · in · psi · ksi");
  s1.blank();
  s1.band("Estado del diseño");
  s1.kv(
    "Verificación",
    { v: res.allOk ? "CUMPLE" : "NO CUMPLE", s: res.allOk ? "ok" : "fail" },
    "",
    res.allOk ? `${res.stirrupsTotal} estribos en la viga` : `${res.failRows} sección(es) no cumplen`
  );
  s1.blank();
  s1.band("Resultados generales");
  s1.head("Parámetro", "Valor", "Unidad", "Nota");
  s1.kv("Carga muerta total D", num(res.Dead, "n3"), "kip/ft", "peso propio + losa + superimpuesta");
  s1.kv("Carga última Wu", num(res.Wu, "n3"), "kip/ft", `${inp.gD}·D + ${inp.gL}·L`);
  s1.kv("Reacción Ra = Rb", num(res.Ra), "kip");
  s1.kv("Peralte d usado", num(res.dReal), "in", "d = máx(d, 0.8H)");
  s1.kv("√f'c", num(res.fcSqrt), "psi");
  s1.kv("Ap torones", num(res.Ap, "n3"), "in²");
  s1.kv("Av estribos", num(res.Av), "in²", `${inp.stirrupBar} × ${inp.legs} ramales`);
  s1.kv("φVc mínimo", num(inp.phi * res.VcMin), "kip", "2√f'c·bw·d");
  s1.kv("φVc máximo", num(inp.phi * res.VcMax), "kip", "5√f'c·bw·d");
  s1.kv("Vs máximo admisible", num(res.Vs8), "kip", "8√f'c·bw·d");
  s1.kv("S máx que rige", num(res.restr.governing), "in", res.restr.governingLabel);
  s1.kv("Primera sección crítica", num(res.xCrit), "ft", CRITICAL[inp.critical]);
  s1.kv("Estribos por semi-luz", { v: res.stirrupsHalf, s: "int" });
  s1.kv("Estribos en toda la viga", { v: res.stirrupsTotal, s: "int" });
  s1.kv("Secciones que no cumplen", { v: res.failRows, s: res.failRows ? "fail" : "int" });
  s1.blank();
  s1.band("Advertencias");
  if (res.warnings.length) res.warnings.forEach((w) => s1.note(w, 70));
  else s1.note("Sin advertencias.");

  /* ---------- Datos de entrada ---------- */
  const s2 = new SheetBuilder(4);
  s2.title("Datos de entrada");
  s2.muted("Valores ingresados en PreBeam para este cálculo.");
  s2.blank();
  const put = (label: string, v: Cell, unit = "", note = "") => s2.kv(label, typeof v === "number" || typeof v === "string" ? { v, s: "text" } : v, unit, note);
  s2.band("Proyecto");
  s2.head("Variable", "Valor", "Unidad", "Descripción");
  put("Proyecto", inp.project || "—");
  put("Elemento", inp.element || "—");
  put("Calculó", inp.author || "—");
  s2.blank();
  s2.band("Norma y factores");
  put("Norma", norma);
  put("φ cortante", inp.phi, "", "factor de reducción de resistencia");
  put("γD", inp.gD, "", "factor de carga muerta");
  put("γL", inp.gL, "", "factor de carga viva");
  s2.blank();
  s2.band("Materiales");
  put("f'c", inp.fc, "psi", "resistencia del concreto");
  put("λ", inp.lambda, "", "1.0 = concreto de peso normal");
  put("fy estribos", inp.fy, "ksi");
  put("fpu torones", inp.fpu, "ksi");
  s2.blank();
  s2.band("Geometría");
  put("Luz L", inp.L, "ft");
  put("Altura H", inp.h, "in");
  put("Ancho del alma bw", inp.bw, "in");
  put("Peralte d ingresado", inp.d, "in");
  put("Peralte d usado", num(res.dReal), "in", "máx(d, 0.8H)");
  s2.blank();
  s2.band("Torones de pretensado");
  inp.strands.forEach((s, i) => {
    const a = STRAND_TYPES[s.type]?.area ?? 0;
    put(`Torón ${i + 1}`, { v: s.qty, s: "text" }, "torones", `${STRAND_TYPES[s.type]?.label ?? s.type} · ${a} in² c/u`);
  });
  put("Ap total", num(strandArea(inp.strands), "n3"), "in²");
  s2.blank();
  s2.band("Refuerzo transversal");
  put("Barra de estribo", STIRRUP_BARS[inp.stirrupBar]?.label ?? inp.stirrupBar);
  put("Área de la barra", STIRRUP_BARS[inp.stirrupBar]?.area ?? 0, "in²");
  put("Ramales", inp.legs);
  put("Av", num(res.Av), "in²", "área × ramales");
  s2.blank();
  s2.band("Cargas distribuidas");
  put("Peso propio", inp.wPP, "kip/ft");
  put("Losa", inp.wLosa, "kip/ft");
  put("Superimpuesta", inp.wSup, "kip/ft");
  put("Viva", inp.wViva, "kip/ft");
  put("Camión de la hoja", yesNo(inp.useTruck), "", "V = 72·[(L−x)−9.33]/L ; M = 72·x·[(L−x)−4.67]/L − 112");
  s2.blank();
  s2.band("Opciones de la tabla");
  put("Primera sección crítica", CRITICAL[inp.critical]);
  put("Paso entre secciones", inp.step, "ft");
  put("Redondeo de S", inp.rounding, "in");
  put("Reducir S máx a la mitad si Vs > 4√f'c·bw·d", yesNo(inp.halveSpacing));

  /* ---------- Tabla de cortante ---------- */
  const s3 = new SheetBuilder(22);
  s3.title("Tabla de cortante vertical");
  s3.muted("Vu, Mu, Vc, Vs y separación de estribos en cada sección a lo largo de la semi-luz. Unidades: kip, kip·ft, ft, in.");
  const groups: [string, number][] = [["Sección", 1], ["Cortante (kip)", 3], ["Momento (kip·ft)", 3], ["Resistencia del concreto (kip)", 6], ["Acero (kip)", 1], ["Separación de estribos (in)", 4], ["Verificación", 4]];
  const gRow = s3.next;
  let c = 0;
  const groupCells: Cell[] = [];
  groups.forEach(([label, span]) => {
    for (let k = 0; k < span; k++) groupCells.push({ v: k === 0 ? label : "", s: "headGroup" });
    if (span > 1) s3.merges.push(`${colName(c)}${gRow}:${colName(c + span - 1)}${gRow}`);
    c += span;
  });
  s3.add(groupCells);
  s3.head("x (ft)", "V", "V camión", "Vu", "M", "M camión", "Mu", "Vu·d/Mu", "φVc calc.", "φVc útil", "φVc mín", "φVc máx", "φVc/2", "φVs", "S teórico", "S máx", "S req.", "S real", "φVn prov.", "D/C", "Estado", "Observación");
  s3.heights[s3.next - 1] = 30;
  res.rows.forEach((r, i) => {
    const obs = [i === 0 ? "Apoyo" : "", r.isCritical ? "Sección crítica" : "", i === res.rows.length - 1 ? "Centro de luz" : "", r.halved ? "S máx ÷ 2" : ""].filter(Boolean).join(" · ");
    s3.add([
      { v: r.x, s: "label" }, num(r.V), num(r.Vt), { v: r.Vu, s: "n2" }, num(r.M), num(r.Mt), { v: r.Mu, s: "n2" }, num(r.ratio, "n3"),
      num(r.phiVcCalc), num(r.phiVcUtil), num(r.phiVcMin), num(r.phiVcMax), num(r.phiVcUtil / 2), num(r.phiVs),
      num(r.sTheo, "n2", true), num(r.sMax), num(r.sReq, "n2", true), r.sReal > 0 ? { v: r.sReal, s: "n2" } : dash,
      num(r.phiVnProv), r.dc > 0 ? num(r.dc, "n3") : dash, statusCell(r.status), { v: obs, s: "text" },
    ]);
  });
  const lastData = s3.next - 1;
  s3.blank();
  s3.note("φVc útil = φVc limitado entre 2√f'c·bw·d y 5√f'c·bw·d · S teórico = Av·fy·d / Vs · S real = S req. redondeado hacia abajo al incremento elegido · Av,mín: si Vu > φVc/2 y φVs ≤ 0 rige S máx.", 220);

  /* ---------- Armado ---------- */
  const s4 = new SheetBuilder(7);
  s4.title("Distribución de estribos");
  s4.muted(`Estribos ${inp.stirrupBar} de ${inp.legs} ramales (Av = ${res.Av.toFixed(2)} in²). Cada zona tiene separación constante; la viga es simétrica respecto al centro de luz.`);
  s4.blank();
  s4.band("Zonas de la semi-luz");
  s4.head("Zona", "De x (ft)", "A x (ft)", "Longitud (ft)", "S (in)", "Estribos", "Estado");
  const z0 = s4.next;
  res.zones.forEach((z, i) => {
    s4.add([{ v: i + 1, s: "label" }, num(z.from), num(z.to), num(z.to - z.from), z.s > 0 ? { v: z.s, s: "n2" } : dash, z.count > 0 ? { v: z.count, s: "int" } : dash, statusCell(z.status)]);
  });
  const z1 = s4.next - 1;
  const rHalf = s4.add([{ v: "Estribos por semi-luz", s: "label" }, { v: "", s: "text" }, { v: "", s: "text" }, { v: "", s: "text" }, { v: "", s: "text" }, { v: res.stirrupsHalf, s: "int", f: z1 >= z0 ? `SUM(F${z0}:F${z1})` : "0" }, { v: "", s: "text" }]);
  s4.add([{ v: "Estribos en toda la viga (×2)", s: "label" }, { v: "", s: "text" }, { v: "", s: "text" }, { v: "", s: "text" }, { v: "", s: "text" }, { v: res.stirrupsTotal, s: "int", f: `2*F${rHalf}` }, { v: "", s: "text" }]);
  s4.blank();
  s4.band("Restricciones de separación máxima S máx");
  s4.head("Restricción", "", "", "", "Valor (in)", "Rige", "");
  const r = res.restr;
  const items: [string, number][] = [
    ["d / 2", r.dHalf],
    ["Distancia máxima: 24 in", r.distance],
    ["0.75 · H", r.threeQuarterH],
    [inp.code === "318-19" ? "Av,mín = máx(0.75√f'c, 50)·bw·s/fy" : "Av,mín = 50·bw·s/fy", r.minAv50],
    ["Av,mín pretensado: 80·Av·fy·d / (fpu·√(d/bw)·Ap)", r.minAvPS],
  ];
  items.forEach(([label, v]) => {
    const rr = s4.add([{ v: label, s: "label" }, { v: "", s: "label" }, { v: "", s: "label" }, { v: "", s: "label" }, isFinite(v) ? num(v) : dash, Math.abs(v - r.governing) < 1e-9 ? { v: "Rige", s: "warn" } : { v: "", s: "text" }, { v: "", s: "text" }]);
    s4.merges.push(`A${rr}:D${rr}`);
  });

  return [
    s1.toSheet("Resumen", { widths: [36, 18, 12, 52], tabColor: "C7F36B" }),
    s2.toSheet("Datos de entrada", { widths: [44, 22, 12, 52], tabColor: "111310" }),
    s3.toSheet("Tabla de cortante", {
      widths: [11, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 11, 9, 13, 30],
      freeze: { rows: 4, cols: 1 },
      autoFilter: `A4:${colName(21)}${lastData}`,
      tabColor: "C7F36B",
    }),
    s4.toSheet("Armado", { widths: [28, 12, 12, 14, 14, 12, 14], tabColor: "111310" }),
  ];
}

/** Genera y descarga el libro; devuelve el nombre del archivo */
export function exportShearXlsx(inp: Inputs, res: Result): string {
  const bytes = buildXlsx(buildShearSheets(inp, res), { title: `PreBeam · ${inp.project || "Cortante vertical"}`, author: inp.author });
  return downloadXlsx(bytes, safeFileName(inp.project, inp.element, "cortante") + ".xlsx");
}
