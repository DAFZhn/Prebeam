/**
 * Motor de cálculo – Cortante vertical en vigas pretensadas
 * Unidades: kip, ft, in, psi / ksi (sistema inglés, igual que la hoja de Excel original)
 */

export type Code = "318-19" | "318-99";
export type CriticalRule = "d/2" | "h/2" | "d";

export const STRAND_TYPES: Record<string, { label: string; area: number }> = {
  none: { label: "— Sin torones —", area: 0 },
  "3/8": { label: '3/8" (Grado 270)', area: 0.085 },
  "7/16": { label: '7/16" (Grado 270)', area: 0.108 },
  "1/2": { label: '1/2" (Grado 270)', area: 0.153 },
  "1/2s": { label: '1/2" especial', area: 0.167 },
  "0.6": { label: '0.6" (Grado 270)', area: 0.217 },
};

export const STIRRUP_BARS: Record<string, { label: string; area: number; dia: number }> = {
  "#3": { label: "#3 (Ø 3/8″)", area: 0.11, dia: 0.375 },
  "#4": { label: "#4 (Ø 1/2″)", area: 0.2, dia: 0.5 },
  "#5": { label: "#5 (Ø 5/8″)", area: 0.31, dia: 0.625 },
  "#6": { label: "#6 (Ø 3/4″)", area: 0.44, dia: 0.75 },
};

export interface StrandRow {
  type: string;
  qty: number;
}

export interface Inputs {
  // información del proyecto
  project: string;
  element: string;
  author: string;
  // norma
  code: Code;
  phi: number;
  gD: number;
  gL: number;
  // materiales
  fc: number; // psi
  lambda: number;
  fy: number; // ksi (estribos)
  fpu: number; // ksi
  // geometría
  L: number; // ft
  d: number; // in
  h: number; // in
  bw: number; // in
  // refuerzo
  strands: StrandRow[];
  stirrupBar: string;
  legs: number;
  // cargas (kip/ft)
  wPP: number;
  wLosa: number;
  wSup: number;
  wViva: number;
  useTruck: boolean;
  // opciones
  critical: CriticalRule;
  step: number; // ft
  rounding: number; // in
  halveSpacing: boolean;
}

export const DEFAULT_INPUTS: Inputs = {
  project: "Puente Río Seco – Tramo 2",
  element: "Viga pretensada V-01",
  author: "",
  code: "318-19",
  phi: 0.75,
  gD: 1.2,
  gL: 1.6,
  fc: 4000,
  lambda: 1,
  fy: 40,
  fpu: 270,
  L: 60,
  d: 35.55,
  h: 38.5,
  bw: 8,
  strands: [
    { type: "1/2", qty: 12 },
    { type: "none", qty: 0 },
  ],
  stirrupBar: "#3",
  legs: 2,
  wPP: 0.725,
  wLosa: 0,
  wSup: 0,
  wViva: 2,
  useTruck: false,
  critical: "d/2",
  step: 4,
  rounding: 1,
  halveSpacing: false,
};

/** Parámetros que reproducen exactamente la hoja de Excel original (ACI 318-99) */
export const EXCEL_INPUTS: Inputs = {
  ...DEFAULT_INPUTS,
  code: "318-99",
  phi: 0.85,
  gD: 1.4,
  gL: 1.7,
};

export const CODE_PRESETS: Record<Code, { phi: number; gD: number; gL: number }> = {
  "318-19": { phi: 0.75, gD: 1.2, gL: 1.6 },
  "318-99": { phi: 0.85, gD: 1.4, gL: 1.7 },
};

export type Status = "ok" | "min" | "none" | "fail";

export interface Row {
  x: number;
  V: number; // cortante de carga distribuida factorizada
  Vt: number; // cortante camión (factorizado)
  Vu: number;
  M: number;
  Mt: number;
  Mu: number;
  ratio: number; // Vu·d/Mu (sin limitar)
  ratioUsed: number; // limitado a 1.0
  phiVcCalc: number; // φVc (kip)
  phiVcUtil: number; // limitado entre mín y máx
  phiVcMin: number;
  phiVcMax: number;
  phiVs: number;
  sTheo: number; // 0 = no requerido
  sMax: number;
  sReq: number;
  sReal: number;
  phiVnProv: number;
  dc: number; // demanda / capacidad
  status: Status;
  halved: boolean;
  needsMin: boolean;
  isCritical: boolean;
}

export interface Zone {
  from: number;
  to: number;
  s: number; // in (0 = sin estribos)
  count: number;
  status: Status;
}

export interface Restrictions {
  dHalf: number;
  distance: number;
  threeQuarterH: number;
  minAv50: number;
  minAvPS: number;
  governing: number;
  governingLabel: string;
}

export interface Result {
  ok: true;
  fcSqrt: number;
  dReal: number;
  dFt: number;
  bwFt: number;
  Ap: number;
  Av: number;
  Wu: number;
  Dead: number;
  Ra: number;
  xCrit: number;
  VcBase: number; // 0.6λ√f'c·bw·d (kip) – parte constante
  VcMin: number;
  VcMax: number;
  Vs4: number; // 4√f'c bw d (kip)
  Vs8: number; // 8√f'c bw d (kip)
  restr: Restrictions;
  rows: Row[];
  zones: Zone[];
  stirrupsHalf: number;
  stirrupsTotal: number;
  allOk: boolean;
  failRows: number;
  warnings: string[];
}

export interface ErrorResult {
  ok: false;
  errors: string[];
}

export function strandArea(rows: StrandRow[]): number {
  return rows.reduce((s, r) => s + (STRAND_TYPES[r.type]?.area ?? 0) * Math.max(0, r.qty), 0);
}

export function buildStations(L: number, xCrit: number, step: number): number[] {
  const half = L / 2;
  const set = new Set<number>();
  set.add(0);
  if (xCrit > 1e-6 && xCrit < half - 1e-6) set.add(Math.round(xCrit * 1e6) / 1e6);
  const st = step > 0.05 ? step : 4;
  for (let x = st; x < half - 1e-6; x += st) {
    const xr = Math.round(x * 1e6) / 1e6;
    if (xr > xCrit + 1e-6) set.add(xr);
  }
  set.add(half);
  return Array.from(set).sort((a, b) => a - b);
}

/* ------------------------------------------------------------------ */
/*  Verificación de cortante en una sección (compartida por todas las  */
/*  herramientas: viga simplemente apoyada, viga continua, …)          */
/* ------------------------------------------------------------------ */

/** Datos mínimos de la sección para verificar cortante */
export type ShearSectionInputs = Pick<
  Inputs,
  "code" | "phi" | "fc" | "lambda" | "fy" | "fpu" | "d" | "h" | "bw" | "strands" | "stirrupBar" | "legs" | "rounding" | "halveSpacing"
>;

export interface ShearContext {
  code: Code;
  phi: number;
  lambda: number;
  fy: number;
  fpu: number;
  bw: number;
  h: number;
  rounding: number;
  halveSpacing: boolean;
  fcSqrt: number;
  dReal: number;
  dFt: number;
  Ap: number;
  Av: number;
  VcBase: number;
  VcMin: number;
  VcMax: number;
  Vs4: number;
  Vs8: number;
  restr: Restrictions;
  warnings: string[];
}

/** Resultado de verificar una sección con (Vu, Mu) dados */
export interface SectionShear {
  ratio: number;
  ratioUsed: number;
  phiVcCalc: number;
  phiVcUtil: number;
  phiVcMin: number;
  phiVcMax: number;
  phiVs: number;
  sTheo: number;
  sMax: number;
  sReq: number;
  sReal: number;
  phiVnProv: number;
  dc: number;
  status: Status;
  halved: boolean;
  needsMin: boolean;
}

/** Errores de los datos de la sección (lista vacía = válido) */
export function validateShearSection(inp: ShearSectionInputs): string[] {
  const errors: string[] = [];
  if (!(inp.fc > 0)) errors.push("f'c debe ser mayor que cero.");
  if (!(inp.bw > 0)) errors.push("El ancho del alma bw debe ser mayor que cero.");
  if (!(inp.d > 0)) errors.push("El peralte efectivo d debe ser mayor que cero.");
  if (!(inp.h > 0)) errors.push("La altura total H debe ser mayor que cero.");
  if (inp.d > inp.h) errors.push("El peralte efectivo d no puede ser mayor que la altura total H.");
  if (!(inp.phi > 0 && inp.phi <= 1)) errors.push("El factor φ debe estar entre 0 y 1.");
  if (!(inp.fy > 0)) errors.push("fy de los estribos debe ser mayor que cero.");
  if (!(inp.fpu > 0)) errors.push("fpu debe ser mayor que cero.");
  if (!(inp.legs > 0)) errors.push("El número de ramales debe ser mayor que cero.");
  return errors;
}

/** Constantes de la sección (Vc, límites, separaciones máximas). Requiere datos válidos. */
export function makeShearContext(inp: ShearSectionInputs): ShearContext {
  const warnings: string[] = [];
  const { phi, lambda, fc, fy, fpu, bw, h } = inp;
  const fcSqrt = Math.sqrt(fc);
  if (fcSqrt > 100) warnings.push("√f'c > 100 psi: ACI 318-19 (22.5.3.1) limita √f'c a 100 psi en el cálculo de Vc.");
  const dReal = Math.max(inp.d, 0.8 * h);
  if (dReal > inp.d + 1e-9) warnings.push("d < 0.8H: se usa d = 0.8H para cortante (ACI 22.5.2.1).");
  const dFt = dReal / 12;
  const Ap = strandArea(inp.strands);
  const Av = (STIRRUP_BARS[inp.stirrupBar]?.area ?? 0) * inp.legs;
  if (Ap <= 0) warnings.push("No se definió área de torones (Ap = 0): la restricción de Av,mín para pretensado no aplica.");
  if (fy > 60) warnings.push("fy de estribos > 60 ksi: el ACI 318-19 (Tabla 20.2.2.4a) limita fyt a 60 ksi para refuerzo a cortante.");

  const VcBase = (0.6 * lambda * fcSqrt * bw * dReal) / 1000;
  const VcMin = (2 * lambda * fcSqrt * bw * dReal) / 1000;
  const VcMax = (5 * lambda * fcSqrt * bw * dReal) / 1000;
  const Vs4 = (4 * fcSqrt * bw * dReal) / 1000;
  const Vs8 = (8 * fcSqrt * bw * dReal) / 1000;

  // restricciones de separación máxima (in)
  const dHalf = dReal / 2;
  const distance = 24;
  const threeQuarterH = 0.75 * h;
  const den = inp.code === "318-19" ? Math.max(50, 0.75 * fcSqrt) : 50;
  const minAv50 = (Av * fy * 1000) / (den * bw);
  const minAvPS = Ap > 0 ? (80 * Av * fy * dReal) / (fpu * Math.sqrt(dReal / bw) * Ap) : Infinity;
  const list: [number, string][] = [
    [dHalf, "d/2"],
    [distance, "24 in"],
    [threeQuarterH, "0.75·H"],
    [minAv50, inp.code === "318-19" ? "Av,mín (50·bw / 0.75√f'c·bw)" : "Av,mín (50·bw)"],
    [minAvPS, "Av,mín pretensado"],
  ];
  const gov = list.reduce((a, b) => (b[0] < a[0] ? b : a));
  const restr: Restrictions = {
    dHalf,
    distance,
    threeQuarterH,
    minAv50,
    minAvPS,
    governing: gov[0],
    governingLabel: gov[1],
  };

  return {
    code: inp.code,
    phi,
    lambda,
    fy,
    fpu,
    bw,
    h,
    rounding: inp.rounding,
    halveSpacing: inp.halveSpacing,
    fcSqrt,
    dReal,
    dFt,
    Ap,
    Av,
    VcBase,
    VcMin,
    VcMax,
    Vs4,
    Vs8,
    restr,
    warnings,
  };
}

/** Verifica una sección con cortante último Vu (kip) y momento concurrente Mu (kip·ft, valor absoluto) */
export function designSection(c: ShearContext, Vu: number, Mu: number): SectionShear {
  const { phi, bw, dReal, dFt, Av, fy } = c;
  const ratio = Mu > 1e-9 ? (Vu * dFt) / Mu : 0;
  const ratioUsed = Math.min(ratio, 1);
  const phiVcCalc = phi * (c.VcBase + (700 * ratioUsed * bw * dReal) / 1000);
  const phiVcMin = phi * c.VcMin;
  const phiVcMax = phi * c.VcMax;
  const phiVcUtil = Math.min(Math.max(phiVcCalc, phiVcMin), phiVcMax);
  const phiVs = Vu - phiVcUtil;
  const Vs = phiVs / phi;
  const halved = c.halveSpacing && Vs > c.Vs4;
  const sMax = c.restr.governing * (halved ? 0.5 : 1);
  const sTheo = phiVs > 1e-9 ? (Av * fy * dReal) / Vs : 0;
  const needsMin = Vu > phiVcUtil / 2 + 1e-9;
  let sReq = 0;
  if (phiVs > 1e-9) sReq = Math.min(sTheo, sMax);
  else if (needsMin) sReq = sMax;
  const sReal = sReq > 0 ? Math.floor(sReq / c.rounding + 1e-9) * c.rounding : 0;
  const phiVsProv = sReal > 0 ? (phi * Av * fy * dReal) / sReal : 0;
  const phiVnProv = phiVcUtil + phiVsProv;
  const dc = phiVnProv > 0 ? Vu / phiVnProv : 0;
  let status: Status = "ok";
  if (Vs > c.Vs8 + 1e-9 || (sReq > 0 && sReal <= 0) || (phiVs > 1e-9 && dc > 1.0001)) status = "fail";
  else if (phiVs <= 1e-9 && needsMin) status = "min";
  else if (phiVs <= 1e-9 && !needsMin) status = "none";
  return { ratio, ratioUsed, phiVcCalc, phiVcUtil, phiVcMin, phiVcMax, phiVs, sTheo, sMax, sReq, sReal, phiVnProv, dc, status, halved, needsMin };
}

export function calculate(inp: Inputs): Result | ErrorResult {
  const errors: string[] = [];
  if (!(inp.L > 0)) errors.push("La luz L debe ser mayor que cero.");
  errors.push(...validateShearSection(inp));
  if (errors.length) return { ok: false, errors };

  const ctx = makeShearContext(inp);
  const warnings: string[] = [...ctx.warnings];
  const { h, L } = inp;
  const { fcSqrt, dReal, dFt, Ap, Av, VcBase, VcMin, VcMax, Vs4, Vs8, restr } = ctx;
  const bw = inp.bw;

  const Dead = inp.wPP + inp.wLosa + inp.wSup;
  const Wu = inp.gD * Dead + inp.gL * inp.wViva;
  const Ra = (Wu * L) / 2;

  let xCrit = dReal / 2 / 12;
  if (inp.critical === "h/2") xCrit = h / 2 / 12;
  if (inp.critical === "d") xCrit = dFt;

  const rowAt = (x: number, isCritical = false): Row => {
    const V = Wu * (L / 2 - x);
    const M = (Wu * x * (L - x)) / 2;
    let Vt = 0;
    let Mt = 0;
    if (inp.useTruck) {
      Vt = Math.max(0, (72 * (L - x - 9.33)) / L) * inp.gL;
      Mt = Math.max(0, (72 * x * (L - x - 4.67)) / L - 112) * inp.gL;
    }
    const Vu = V + Vt;
    const Mu = M + Mt;
    return { x, V, Vt, Vu, M, Mt, Mu, ...designSection(ctx, Vu, Mu), isCritical };
  };

  const stations = buildStations(L, xCrit, inp.step);
  const rows = stations.map((x) => rowAt(x, Math.abs(x - xCrit) < 1e-6 && xCrit > 0));

  // zonas de estribos (cada separación rige hasta la siguiente sección)
  const zones: Zone[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const from = rows[i].x;
    const to = rows[i + 1].x;
    const s = rows[i].sReal;
    const last = zones[zones.length - 1];
    if (last && last.s === s) {
      last.to = to;
    } else zones.push({ from, to, s, count: 0, status: rows[i].status });
  }
  zones.forEach((z) => {
    z.count = z.s > 0 ? Math.ceil(((z.to - z.from) * 12) / z.s - 1e-9) : 0;
  });
  const stirrupsHalf = zones.reduce((a, z) => a + z.count, 0);
  const failRows = rows.filter((r) => r.status === "fail").length;
  if (failRows > 0)
    warnings.push(
      "Hay secciones que no cumplen (Vs > 8√f'c·bw·d, separación < incremento de redondeo o D/C > 1). Aumente la sección, f'c o el refuerzo transversal."
    );
  if (rows.some((r) => r.sReq > 0 && r.sReq < 2 && r.status !== "fail"))
    warnings.push("Se requieren separaciones menores a 2 in en alguna sección: considere estribos de mayor diámetro o más ramales.");

  return {
    ok: true,
    fcSqrt,
    dReal,
    dFt,
    bwFt: bw / 12,
    Ap,
    Av,
    Wu,
    Dead,
    Ra,
    xCrit,
    VcBase,
    VcMin,
    VcMax,
    Vs4,
    Vs8,
    restr,
    rows,
    zones,
    stirrupsHalf,
    stirrupsTotal: stirrupsHalf * 2,
    allOk: failRows === 0,
    failRows,
    warnings,
    // helper para curvas densas
    ...({ rowAt } as object),
  } as Result;
}

/** Curvas densas para gráficas (reutiliza la misma lógica de la tabla) */
export function denseCurve(inp: Inputs, res: Result, n = 120): Row[] {
  const rowAt = (res as unknown as { rowAt: (x: number) => Row }).rowAt;
  const half = inp.L / 2;
  const xs = new Set<number>();
  for (let i = 0; i <= n; i++) xs.add(Math.round(((half * i) / n) * 1e4) / 1e4);
  xs.add(Math.round(res.xCrit * 1e4) / 1e4);
  res.rows.forEach((r) => xs.add(Math.round(r.x * 1e4) / 1e4));
  return Array.from(xs)
    .sort((a, b) => a - b)
    .map((x) => rowAt(x));
}
