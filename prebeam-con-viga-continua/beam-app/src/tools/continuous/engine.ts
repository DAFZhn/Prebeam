/**
 * Motor de cálculo – Viga continua pretensada / presforzada
 * Análisis por el método de rigidez (EI relativo por tramo) + verificación a cortante y flexión.
 * Unidades: kip, ft, in, psi / ksi (sistema inglés).
 *
 * Convenciones:
 *  - Cargas gravitacionales hacia abajo (positivas).
 *  - Cortante V positivo cuando la cara izquierda de la sección sube.
 *  - Momento M positivo = tracción en la fibra inferior (sagging); negativo en apoyos.
 */
import {
  designSection,
  makeShearContext,
  strandArea,
  validateShearSection,
  type Code,
  type CriticalRule,
  type SectionShear,
  type ShearContext,
  type Status,
  type StrandRow,
} from "../../lib/calc";

export type EndCond = "pinned" | "fixed" | "free";
export type LoadKind = "D" | "L";

export interface Span {
  L: number; // ft
  EIrel: number; // rigidez relativa EI (1 = referencia)
  wD: number; // kip/ft carga muerta (total, incluye peso propio)
  wL: number; // kip/ft carga viva
}

export interface PointLoad {
  span: number; // índice de tramo (0-based)
  a: number; // ft desde el extremo izquierdo del tramo
  P: number; // kip
  kind: LoadKind;
}

export interface ContinuousInputs {
  project: string;
  element: string;
  author: string;
  code: Code;
  phi: number; // cortante
  gD: number;
  gL: number;
  // materiales
  fc: number; // psi
  lambda: number;
  fy: number; // ksi estribos
  fpu: number; // ksi
  // sección
  d: number;
  h: number;
  bw: number;
  strands: StrandRow[];
  stirrupBar: string;
  legs: number;
  // opciones cortante
  critical: CriticalRule;
  step: number;
  rounding: number;
  halveSpacing: boolean;
  supportWidth: number; // in (ancho del apoyo; la sección crítica se mide desde la cara)
  // geometría y cargas
  spans: Span[];
  leftEnd: EndCond;
  rightEnd: EndCond;
  points: PointLoad[];
  pattern: boolean; // alternancia de carga viva
  // flexión
  phiF: number;
  bf: number; // ancho de compresión (momento positivo)
  hf: number; // espesor del ala
  dp: number; // peralte a torones / acero inferior
  fse: number; // ksi pretensado efectivo
  asBot: number; // in² acero ordinario inferior
  asTop: number; // in² acero ordinario superior
  dNeg: number; // in, de la fibra inferior al acero superior
  bNeg: number; // in, ancho de compresión en momento negativo
  fyL: number; // ksi acero longitudinal ordinario
}

export const DEFAULT_CONTINUOUS: ContinuousInputs = {
  project: "Puente Río Seco – Tramos 1 y 2",
  element: "Viga continua V-C1",
  author: "",
  code: "318-19",
  phi: 0.75,
  gD: 1.2,
  gL: 1.6,
  fc: 4000,
  lambda: 1,
  fy: 40,
  fpu: 270,
  d: 35.55,
  h: 38.5,
  bw: 8,
  strands: [
    { type: "1/2", qty: 12 },
    { type: "none", qty: 0 },
  ],
  stirrupBar: "#3",
  legs: 2,
  critical: "h/2",
  step: 4,
  rounding: 1,
  halveSpacing: true,
  supportWidth: 12,
  spans: [
    { L: 40, EIrel: 1, wD: 0.725, wL: 2 },
    { L: 40, EIrel: 1, wD: 0.725, wL: 2 },
  ],
  leftEnd: "pinned",
  rightEnd: "pinned",
  points: [],
  pattern: true,
  phiF: 0.9,
  bf: 36,
  hf: 6,
  dp: 35.55,
  fse: 160,
  asBot: 0,
  asTop: 6,
  dNeg: 36.5,
  bNeg: 20,
  fyL: 60,
};

/* ------------------------------------------------------------------ */
/*  Resultados                                                         */
/* ------------------------------------------------------------------ */

export interface FlexCapacity {
  beta1: number;
  fps: number; // ksi
  aPos: number; // in
  epsPos: number;
  phiPos: number;
  phiMnPos: number; // kip·ft
  aNeg: number;
  epsNeg: number;
  phiNeg: number;
  phiMnNeg: number; // kip·ft
}

export interface NodeInfo {
  index: number;
  X: number; // ft desde el extremo izquierdo
  kind: "apoyo" | "empotramiento" | "libre";
  RD: number; // reacción de servicio, carga muerta (kip)
  RL: number; // reacción de servicio, toda la carga viva (kip)
  Rmax: number; // reacción última máxima (kip)
  Rmin: number; // reacción última mínima (kip)
  Mmax: number; // momento último en el nodo, máx (kip·ft)
  Mmin: number; // momento último en el nodo, mín (kip·ft)
  asReq: number | null; // in², acero superior requerido por Mmin (null = no aplica)
  asDc: number | null; // As requerido / As provisto
}

export type FlexStatus = "ok" | "fail" | "none";

export interface StationRow {
  span: number;
  x: number; // ft local al tramo
  X: number; // ft global
  xEval: number; // ft local donde se toma el cortante de diseño
  clamped: boolean; // cortante tomado en la sección crítica
  isSupport: boolean;
  isCritical: boolean;
  isLoad: boolean;
  Vu: number; // cortante de diseño (kip, con signo)
  Mc: number; // |Mu| concurrente con Vu (kip·ft)
  shear: SectionShear;
  MuPos: number;
  MuNeg: number;
  dcPos: number;
  dcNeg: number;
  flexStatus: FlexStatus;
}

export interface ContZone {
  span: number;
  from: number; // ft local
  to: number;
  s: number;
  count: number;
  status: Status;
}

export interface DensePoint {
  X: number;
  Vpos: number;
  Vneg: number;
  Mpos: number;
  Mneg: number;
}

export interface ContinuousResult {
  ok: true;
  ctx: ShearContext;
  flex: FlexCapacity;
  total: number; // longitud total, ft
  spanStart: number[]; // X de inicio de cada tramo
  nodes: NodeInfo[];
  rows: StationRow[];
  zones: ContZone[];
  dense: DensePoint[];
  stirrupsTotal: number;
  failShear: number;
  failFlex: number;
  allOk: boolean;
  VuMax: number;
  MuPosMax: number;
  MuNegMax: number; // valor más negativo (≤ 0)
  warnings: string[];
}

export interface ContinuousError {
  ok: false;
  errors: string[];
}

/* ------------------------------------------------------------------ */
/*  Método de rigidez                                                  */
/* ------------------------------------------------------------------ */

interface SpanLoad {
  w: number;
  pts: { a: number; P: number }[];
}

interface CaseSol {
  V1: number[];
  M1: number[];
  loads: SpanLoad[];
  Rv: number[];
  Rm: number[];
}

function fixedEndActions(L: number, ld: SpanLoad): [number, number, number, number] {
  let V1 = (ld.w * L) / 2;
  let V2 = V1;
  let M1 = (ld.w * L * L) / 12;
  let M2 = -M1;
  for (const p of ld.pts) {
    const a = p.a;
    const b = L - a;
    V1 += (p.P * b * b * (3 * a + b)) / L ** 3;
    V2 += (p.P * a * a * (a + 3 * b)) / L ** 3;
    M1 += (p.P * a * b * b) / (L * L);
    M2 -= (p.P * a * a * b) / (L * L);
  }
  return [V1, M1, V2, M2];
}

function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  if (n === 0) return [];
  const M = A.map((r, i) => [...r, b[i]]);
  let scale = 0;
  for (const r of A) for (const v of r) scale = Math.max(scale, Math.abs(v));
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-10 * scale) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
    x[r] = s / M[r][r];
  }
  return x;
}

function solveCase(spans: Span[], left: EndCond, right: EndCond, loads: SpanLoad[]): CaseSol | null {
  const n = spans.length;
  const nd = 2 * (n + 1);
  const K = Array.from({ length: nd }, () => new Array<number>(nd).fill(0));
  const F = new Array<number>(nd).fill(0);
  const kes: number[][][] = [];
  const fes: number[][] = [];

  spans.forEach((s, i) => {
    const L = s.L;
    const c = s.EIrel / L ** 3;
    const ke = [
      [12, 6 * L, -12, 6 * L],
      [6 * L, 4 * L * L, -6 * L, 2 * L * L],
      [-12, -6 * L, 12, -6 * L],
      [6 * L, 2 * L * L, -6 * L, 4 * L * L],
    ].map((r) => r.map((v) => v * c));
    const fe = fixedEndActions(L, loads[i]);
    kes.push(ke);
    fes.push(fe);
    for (let a = 0; a < 4; a++) {
      F[2 * i + a] -= fe[a];
      for (let b = 0; b < 4; b++) K[2 * i + a][2 * i + b] += ke[a][b];
    }
  });

  const restrained = new Set<number>();
  if (left !== "free") restrained.add(0);
  if (left === "fixed") restrained.add(1);
  for (let j = 1; j < n; j++) restrained.add(2 * j);
  if (right !== "free") restrained.add(2 * n);
  if (right === "fixed") restrained.add(2 * n + 1);

  const free: number[] = [];
  for (let k = 0; k < nd; k++) if (!restrained.has(k)) free.push(k);
  const Kff = free.map((r) => free.map((c) => K[r][c]));
  const Ff = free.map((r) => F[r]);
  const uf = solveLinear(Kff, Ff);
  if (!uf) return null;
  const u = new Array<number>(nd).fill(0);
  free.forEach((k, idx) => (u[k] = uf[idx]));

  const V1: number[] = [];
  const M1: number[] = [];
  const Rv = new Array<number>(n + 1).fill(0);
  const Rm = new Array<number>(n + 1).fill(0);
  spans.forEach((_, i) => {
    const ue = [u[2 * i], u[2 * i + 1], u[2 * i + 2], u[2 * i + 3]];
    const f = kes[i].map((row, a) => row.reduce((acc, v, b) => acc + v * ue[b], 0) + fes[i][a]);
    V1.push(f[0]);
    M1.push(f[1]);
    Rv[i] += f[0];
    Rm[i] += f[1];
    Rv[i + 1] += f[2];
    Rm[i + 1] += f[3];
  });
  return { V1, M1, loads, Rv, Rm };
}

function evalSpan(sol: CaseSol, i: number, x: number): { V: number; M: number } {
  const ld = sol.loads[i];
  let V = sol.V1[i] - ld.w * x;
  let M = -sol.M1[i] + sol.V1[i] * x - (ld.w * x * x) / 2;
  for (const p of ld.pts) {
    if (x > p.a) {
      V -= p.P;
      M -= p.P * (x - p.a);
    }
  }
  return { V, M };
}

/* ------------------------------------------------------------------ */
/*  Flexión                                                            */
/* ------------------------------------------------------------------ */

function beta1Of(fc: number): number {
  return Math.max(0.65, Math.min(0.85, 0.85 - (0.05 * (fc - 4000)) / 1000));
}

function phiFlexure(eps: number, phiF: number): number {
  if (eps >= 0.005) return phiF;
  if (eps <= 0.002) return 0.65;
  return 0.65 + ((eps - 0.002) * (phiF - 0.65)) / 0.003;
}

function flexCapacity(inp: ContinuousInputs, Aps: number): FlexCapacity {
  const fcK = inp.fc / 1000;
  const b1 = beta1Of(inp.fc);
  // --- momento positivo: torones + acero ordinario inferior (bloque rectangular, a ≤ hf)
  const rhoP = Aps / (inp.bf * inp.dp);
  const omegaS = (inp.asBot * inp.fyL) / (inp.bf * inp.dp * fcK);
  const gammaP = 0.28;
  const fps = Aps > 0 ? inp.fpu * (1 - (gammaP / b1) * ((rhoP * inp.fpu) / fcK + omegaS)) : 0;
  const T = Aps * fps + inp.asBot * inp.fyL;
  const aPos = T > 0 ? T / (0.85 * fcK * inp.bf) : 0;
  const cPos = aPos / b1;
  const epsPos = cPos > 0 ? (0.003 * (inp.dp - cPos)) / cPos : 0;
  const phiPos = phiFlexure(epsPos, inp.phiF);
  const MnPos = (Aps * fps * (inp.dp - aPos / 2) + inp.asBot * inp.fyL * (inp.dp - aPos / 2)) / 12;
  // --- momento negativo: acero ordinario superior (compresión en el patín inferior)
  const Tn = inp.asTop * inp.fyL;
  const aNeg = Tn > 0 ? Tn / (0.85 * fcK * inp.bNeg) : 0;
  const cNeg = aNeg / b1;
  const epsNeg = cNeg > 0 ? (0.003 * (inp.dNeg - cNeg)) / cNeg : 0;
  const phiNeg = phiFlexure(epsNeg, inp.phiF);
  const MnNeg = (Tn * (inp.dNeg - aNeg / 2)) / 12;
  return {
    beta1: b1,
    fps,
    aPos,
    epsPos,
    phiPos,
    phiMnPos: phiPos * MnPos,
    aNeg,
    epsNeg,
    phiNeg,
    phiMnNeg: phiNeg * MnNeg,
  };
}

/** Acero ordinario superior requerido (in²) para resistir Mu (kip·ft) con bloque rectangular */
function asRequired(Mu: number, inp: ContinuousInputs): number | null {
  if (Mu <= 1e-9) return 0;
  const fcK = inp.fc / 1000;
  const Rn = (Mu * 12) / (inp.phiF * inp.bNeg * inp.dNeg * inp.dNeg); // ksi
  const arg = 1 - (2 * Rn) / (0.85 * fcK);
  if (arg < 0) return null;
  return ((0.85 * fcK * inp.bNeg * inp.dNeg) / inp.fyL) * (1 - Math.sqrt(arg));
}

/* ------------------------------------------------------------------ */
/*  Validación                                                         */
/* ------------------------------------------------------------------ */

export function validateContinuous(inp: ContinuousInputs): string[] {
  const errors: string[] = [];
  if (inp.spans.length < 1) errors.push("Agregue al menos un tramo.");
  inp.spans.forEach((s, i) => {
    if (!(s.L > 0)) errors.push(`Tramo ${i + 1}: la luz debe ser mayor que cero.`);
    if (!(s.EIrel > 0)) errors.push(`Tramo ${i + 1}: la rigidez relativa EI debe ser mayor que cero.`);
    if (s.wD < 0 || s.wL < 0) errors.push(`Tramo ${i + 1}: las cargas distribuidas no pueden ser negativas.`);
  });
  inp.points.forEach((p, k) => {
    const s = inp.spans[p.span];
    if (!s) errors.push(`Carga puntual ${k + 1}: el tramo ${p.span + 1} no existe.`);
    else if (!(p.a >= 0 && p.a <= s.L)) errors.push(`Carga puntual ${k + 1}: la posición debe estar entre 0 y ${s.L} ft.`);
  });
  errors.push(...validateShearSection(inp));
  if (!(inp.phiF > 0 && inp.phiF <= 1)) errors.push("El factor φ de flexión debe estar entre 0 y 1.");
  if (!(inp.bf > 0)) errors.push("El ancho de compresión bf debe ser mayor que cero.");
  if (!(inp.bNeg > 0)) errors.push("El ancho de compresión para momento negativo debe ser mayor que cero.");
  if (!(inp.dp > 0)) errors.push("El peralte dp debe ser mayor que cero.");
  if (!(inp.dNeg > 0)) errors.push("El peralte para momento negativo debe ser mayor que cero.");
  if (!(inp.fyL > 0)) errors.push("fy del acero longitudinal debe ser mayor que cero.");
  return errors;
}

/* ------------------------------------------------------------------ */
/*  Cálculo principal                                                  */
/* ------------------------------------------------------------------ */

const EPS = 1e-4;
const key = (x: number) => Math.round(x * 1e6) / 1e6;

export function calculateContinuous(inp: ContinuousInputs): ContinuousResult | ContinuousError {
  const errors = validateContinuous(inp);
  if (errors.length) return { ok: false, errors };

  const { spans, gD, gL } = inp;
  const n = spans.length;
  const warnings: string[] = [];

  // ---- casos de carga: D (todo) y L_i (solo el tramo i)
  const mkLoads = (kind: LoadKind, only: number | null): SpanLoad[] =>
    spans.map((s, i) => {
      const on = only === null || only === i;
      return {
        w: on ? (kind === "D" ? s.wD : s.wL) : 0,
        pts: on ? inp.points.filter((p) => p.span === i && p.kind === kind).map((p) => ({ a: p.a, P: p.P })) : [],
      };
    });
  const solD = solveCase(spans, inp.leftEnd, inp.rightEnd, mkLoads("D", null));
  const solL = spans.map((_, i) => solveCase(spans, inp.leftEnd, inp.rightEnd, mkLoads("L", i)));
  if (!solD || solL.some((s) => !s)) {
    return {
      ok: false,
      errors: [
        "La estructura es inestable (mecanismo). Revise las condiciones de extremo: un voladizo requiere al menos dos apoyos verticales (o un empotramiento) en el resto de la viga.",
      ],
    };
  }
  const SL = solL as CaseSol[];

  // ---- geometría global
  const spanStart: number[] = [];
  let acc = 0;
  spans.forEach((s) => {
    spanStart.push(acc);
    acc += s.L;
  });
  const total = acc;

  // ---- sección de cortante y flexión
  const ctx = makeShearContext(inp);
  warnings.push(...ctx.warnings);
  const Aps = strandArea(inp.strands);
  const flex = flexCapacity(inp, Aps);
  if (Aps > 0 && inp.fse < 0.5 * inp.fpu)
    warnings.push("fse < 0.5·fpu: la expresión aproximada de fps (ACI 20.3.2.3.1) no es aplicable; la capacidad a flexión puede ser no conservadora.");
  if (flex.aPos > inp.hf + 1e-9)
    warnings.push(`Momento positivo: a = ${flex.aPos.toFixed(2)} in > hf = ${inp.hf} in. El bloque de compresión entra en el alma; la capacidad calculada con ancho bf es aproximada (no conservadora).`);
  if (flex.epsPos > 0 && flex.epsPos < 0.005) warnings.push(`Momento positivo: εt = ${flex.epsPos.toFixed(4)} < 0.005; φ reducido a ${flex.phiPos.toFixed(2)}.`);
  if (flex.epsNeg > 0 && flex.epsNeg < 0.005) warnings.push(`Momento negativo: εt = ${flex.epsNeg.toFixed(4)} < 0.005; φ reducido a ${flex.phiNeg.toFixed(2)}.`);
  if (inp.asTop <= 0) warnings.push("No se definió acero superior (As,sup = 0): no hay capacidad a momento negativo y los apoyos continuos no cumplirán.");

  // ---- nodos y apoyos
  const isSupportNode = (j: number) => (j === 0 ? inp.leftEnd !== "free" : j === n ? inp.rightEnd !== "free" : true);
  const nodeKind = (j: number): NodeInfo["kind"] =>
    j === 0 ? (inp.leftEnd === "fixed" ? "empotramiento" : inp.leftEnd === "free" ? "libre" : "apoyo") : j === n ? (inp.rightEnd === "fixed" ? "empotramiento" : inp.rightEnd === "free" ? "libre" : "apoyo") : "apoyo";

  // ---- envolvente en un punto del tramo i, posición local x
  const envAt = (i: number, x: number) => {
    const d = evalSpan(solD, i, x);
    const ls = SL.map((s) => evalSpan(s, i, x));
    let Vpos: number, Vneg: number, Mpos: number, Mneg: number, McPos: number, McNeg: number;
    if (inp.pattern) {
      let sVp = 0, sVn = 0, sMp = 0, sMn = 0, cMp = 0, cMn = 0;
      for (const l of ls) {
        if (l.V > 0) {
          sVp += l.V;
          cMp += l.M;
        } else if (l.V < 0) {
          sVn += l.V;
          cMn += l.M;
        }
        if (l.M > 0) sMp += l.M;
        else sMn += l.M;
      }
      Vpos = gD * d.V + gL * sVp;
      Vneg = gD * d.V + gL * sVn;
      Mpos = gD * d.M + gL * sMp;
      Mneg = gD * d.M + gL * sMn;
      McPos = gD * d.M + gL * cMp;
      McNeg = gD * d.M + gL * cMn;
    } else {
      const sV = ls.reduce((a, l) => a + l.V, 0);
      const sM = ls.reduce((a, l) => a + l.M, 0);
      Vpos = Vneg = gD * d.V + gL * sV;
      Mpos = Mneg = McPos = McNeg = gD * d.M + gL * sM;
    }
    const useP = Math.abs(Vpos) >= Math.abs(Vneg);
    return { Vpos, Vneg, Mpos, Mneg, Vu: useP ? Vpos : Vneg, Mc: Math.abs(useP ? McPos : McNeg) };
  };

  /** Envolvente de cortante de diseño; si hay carga puntual exactamente en x se toman ambos lados */
  const envDesign = (i: number, x: number) => {
    const here = inp.points.filter((p) => p.span === i && Math.abs(p.a - x) < 1e-6);
    if (!here.length) return envAt(i, x);
    const a = envAt(i, Math.max(0, x - EPS));
    const b = envAt(i, Math.min(spans[i].L, x + EPS));
    return Math.abs(a.Vu) >= Math.abs(b.Vu) ? a : b;
  };

  // ---- sección crítica (distancia desde el eje del apoyo, en ft)
  let xr = ctx.dReal / 2 / 12;
  if (inp.critical === "h/2") xr = inp.h / 2 / 12;
  if (inp.critical === "d") xr = ctx.dFt;
  const critDist = inp.supportWidth / 2 / 12 + xr;

  // ---- estaciones de diseño
  const rows: StationRow[] = [];
  spans.forEach((s, i) => {
    const L = s.L;
    const dc = Math.min(critDist, L / 2);
    const supL = isSupportNode(i);
    const supR = isSupportNode(i + 1);
    const flags = new Map<number, { crit?: boolean; load?: boolean }>();
    const add = (x: number, f: { crit?: boolean; load?: boolean } = {}) => {
      const k = key(x);
      flags.set(k, { ...flags.get(k), ...f });
    };
    add(0);
    add(L);
    if (supL) add(dc, { crit: true });
    if (supR) add(L - dc, { crit: true });
    const st = inp.step > 0.05 ? inp.step : 4;
    for (let x = st; x < L - 1e-6; x += st) {
      if (supL && x < dc - 1e-6) continue;
      if (supR && x > L - dc + 1e-6) continue;
      add(x);
    }
    inp.points.filter((p) => p.span === i).forEach((p) => add(p.a, { load: true }));
    Array.from(flags.keys())
      .sort((a, b) => a - b)
      .forEach((x) => {
        const f = flags.get(x)!;
        let xEval = x;
        let clamped = false;
        if (supL && x < dc - 1e-6) {
          xEval = dc;
          clamped = true;
        }
        if (supR && x > L - dc + 1e-6) {
          xEval = L - dc;
          clamped = true;
        }
        const e = envDesign(i, xEval);
        const act = envAt(i, x);
        const shear = designSection(ctx, Math.abs(e.Vu), e.Mc);
        const MuPos = Math.max(act.Mpos, 0);
        const MuNeg = Math.min(act.Mneg, 0);
        const dcPos = MuPos > 1e-9 ? (flex.phiMnPos > 0 ? MuPos / flex.phiMnPos : Infinity) : 0;
        const dcNeg = MuNeg < -1e-3 ? (flex.phiMnNeg > 0 ? -MuNeg / flex.phiMnNeg : Infinity) : 0;
        const flexStatus: FlexStatus = dcPos > 1.0001 || dcNeg > 1.0001 ? "fail" : dcPos > 0 || dcNeg > 0 ? "ok" : "none";
        rows.push({
          span: i,
          x,
          X: spanStart[i] + x,
          xEval,
          clamped,
          isSupport: (x < 1e-6 && supL) || (x > L - 1e-6 && supR),
          isCritical: !!f.crit,
          isLoad: !!f.load,
          Vu: e.Vu,
          Mc: e.Mc,
          shear,
          MuPos,
          MuNeg,
          dcPos,
          dcNeg,
          flexStatus,
        });
      });
  });

  // ---- zonas de estribos: en cada intervalo rige la menor separación de sus dos extremos
  const zones: ContZone[] = [];
  spans.forEach((_, i) => {
    const rs = rows.filter((r) => r.span === i);
    for (let k = 0; k < rs.length - 1; k++) {
      const a = rs[k];
      const b = rs[k + 1];
      const cands = [a.shear.sReal, b.shear.sReal].filter((v) => v > 0);
      const s = cands.length ? Math.min(...cands) : 0;
      const status: Status = a.shear.status === "fail" || b.shear.status === "fail" ? "fail" : a.shear.status === "ok" || b.shear.status === "ok" ? "ok" : a.shear.status === "min" || b.shear.status === "min" ? "min" : "none";
      const last = zones[zones.length - 1];
      if (last && last.span === i && last.s === s) {
        last.to = b.x;
        if (status === "fail") last.status = "fail";
      } else zones.push({ span: i, from: a.x, to: b.x, s, count: 0, status });
    }
  });
  zones.forEach((z) => (z.count = z.s > 0 ? Math.ceil(((z.to - z.from) * 12) / z.s - 1e-9) : 0));
  const stirrupsTotal = zones.reduce((a, z) => a + z.count, 0);

  // ---- nodos: reacciones, momentos de apoyo y acero requerido
  const nodes: NodeInfo[] = [];
  for (let j = 0; j <= n; j++) {
    const kind = nodeKind(j);
    const RD = solD.Rv[j];
    const RL = SL.reduce((a, s) => a + s.Rv[j], 0);
    let Rmax: number, Rmin: number;
    if (inp.pattern) {
      Rmax = gD * RD + gL * SL.reduce((a, s) => a + Math.max(0, s.Rv[j]), 0);
      Rmin = gD * RD + gL * SL.reduce((a, s) => a + Math.min(0, s.Rv[j]), 0);
    } else Rmax = Rmin = gD * RD + gL * RL;
    const sp = j === 0 ? 0 : j - 1;
    const xx = j === 0 ? 0 : spans[j - 1].L;
    const e = kind === "libre" ? { Mpos: 0, Mneg: 0 } : envAt(sp, xx);
    const Mneg = Math.min(e.Mneg, 0);
    let asReq: number | null = null;
    let asDc: number | null = null;
    if (kind !== "libre" && Mneg < -1e-3) {
      asReq = asRequired(-Mneg, inp);
      asDc = asReq === null ? Infinity : inp.asTop > 0 ? asReq / inp.asTop : Infinity;
    }
    nodes.push({ index: j, X: j === 0 ? 0 : spanStart[j - 1] + spans[j - 1].L, kind, RD, RL, Rmax, Rmin, Mmax: Math.max(e.Mpos, 0), Mmin: Mneg, asReq, asDc });
  }

  // ---- curvas densas para gráficas
  const dense: DensePoint[] = [];
  spans.forEach((s, i) => {
    const m = Math.min(160, Math.max(24, Math.ceil(s.L * 2)));
    const xs = new Set<number>();
    for (let k = 0; k <= m; k++) xs.add(key((s.L * k) / m));
    inp.points
      .filter((p) => p.span === i)
      .forEach((p) => {
        xs.add(key(Math.max(0, p.a - EPS)));
        xs.add(key(Math.min(s.L, p.a + EPS)));
      });
    Array.from(xs)
      .sort((a, b) => a - b)
      .forEach((x) => {
        const e = envAt(i, x);
        dense.push({ X: spanStart[i] + x, Vpos: e.Vpos, Vneg: e.Vneg, Mpos: e.Mpos, Mneg: e.Mneg });
      });
  });

  const failShear = rows.filter((r) => r.shear.status === "fail").length;
  const failFlex = rows.filter((r) => r.flexStatus === "fail").length;
  if (failShear > 0)
    warnings.push("Hay secciones que no cumplen a cortante (Vs > 8√f'c·bw·d, separación < incremento de redondeo o D/C > 1). Aumente la sección, f'c o el refuerzo transversal.");
  if (failFlex > 0) warnings.push("Hay secciones que no cumplen a flexión (Mu > φMn). Aumente torones o acero ordinario, o revise la sección.");
  if (rows.some((r) => r.shear.sReq > 0 && r.shear.sReq < 2 && r.shear.status !== "fail"))
    warnings.push("Se requieren separaciones menores a 2 in en alguna sección: considere estribos de mayor diámetro o más ramales.");
  if (nodes.some((nd) => nd.Rmin < -1e-6 && nd.kind === "apoyo"))
    warnings.push("Con alternancia de carga viva aparece levantamiento (reacción negativa) en algún apoyo: revise anclaje o apoyo a tracción.");

  const VuMax = Math.max(...rows.map((r) => Math.abs(r.Vu)));
  const MuPosMax = Math.max(0, ...dense.map((p) => p.Mpos));
  const MuNegMax = Math.min(0, ...dense.map((p) => p.Mneg));

  return {
    ok: true,
    ctx,
    flex,
    total,
    spanStart,
    nodes,
    rows,
    zones,
    dense,
    stirrupsTotal,
    failShear,
    failFlex,
    allOk: failShear === 0 && failFlex === 0,
    VuMax,
    MuPosMax,
    MuNegMax,
    warnings,
  };
}
