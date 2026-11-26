import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowDownToLine, Cable, Download, Info, Layers, Printer, RotateCcw, Ruler, ScrollText, ShieldAlert, ShieldCheck, Sigma } from "lucide-react";
import { SectionTitle } from "../../components/ui";
import { Kpi } from "../../components/Kpis";
import ToolFrame, { Pill } from "../../components/ToolFrame";
import { calculateContinuous, DEFAULT_CONTINUOUS, type ContinuousInputs, type ContinuousResult } from "./engine";
import ContinuousInputPanel from "./ContinuousInputPanel";
import ContinuousSchematic from "./ContinuousSchematic";
import ContinuousCharts from "./ContinuousCharts";
import { FlexCapacityCard, NodesTable, StationsTable, ZonesTable } from "./ContinuousTables";
import { exportContinuousCsv } from "./export";
import { f2, nodeName } from "./format";

const STORAGE_KEY = "prebeam-continuous-v1";

function loadInputs(): ContinuousInputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const merged: ContinuousInputs = { ...DEFAULT_CONTINUOUS, ...p };
      if (!Array.isArray(merged.spans) || merged.spans.length === 0) merged.spans = DEFAULT_CONTINUOUS.spans;
      if (!Array.isArray(merged.points)) merged.points = [];
      if (!Array.isArray(merged.strands)) merged.strands = DEFAULT_CONTINUOUS.strands;
      return merged;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CONTINUOUS;
}

const nav = [
  { id: "resumen", label: "Resumen" },
  { id: "esquema", label: "Esquema" },
  { id: "graficas", label: "Diagramas" },
  { id: "tabla", label: "Tabla de diseño" },
  { id: "apoyos", label: "Apoyos y flexión" },
  { id: "armado", label: "Armado" },
  { id: "notas", label: "Alcance" },
];

const endLabel = { pinned: "articulado", fixed: "empotrado", free: "voladizo" } as const;

export default function ContinuousTool() {
  const [inp, setInp] = useState<ContinuousInputs>(loadInputs);
  const set = (patch: Partial<ContinuousInputs>) => setInp((p) => ({ ...p, ...patch }));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inp));
    } catch {
      /* ignore */
    }
  }, [inp]);

  const out = useMemo(() => calculateContinuous(inp), [inp]);
  const res: ContinuousResult | null = out.ok ? out : null;
  const today = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40";

  const maxR = res ? res.nodes.reduce((a, b) => (b.Rmax > a.Rmax ? b : a)) : null;

  return (
    <ToolFrame
      nav={nav}
      badges={
        <>
          <Pill>
            {inp.code === "318-19" ? "ACI 318-19" : "ACI 318-99"} · φ cortante = {inp.phi}
          </Pill>
          <Pill>
            {inp.spans.length} tramo{inp.spans.length > 1 ? "s" : ""} · extremos {endLabel[inp.leftEnd]} / {endLabel[inp.rightEnd]}
          </Pill>
          <Pill>{inp.pattern ? "Con alternancia de carga viva" : "Carga viva simultánea"}</Pill>
          <Pill>Sistema inglés (kip · ft · in)</Pill>
        </>
      }
      actions={
        <>
          <button onClick={() => setInp(DEFAULT_CONTINUOUS)} className={btn}>
            <RotateCcw className="h-3.5 w-3.5" /> Datos de ejemplo
          </button>
          <button disabled={!res} onClick={() => res && exportContinuousCsv(res, (inp.element || "viga_continua").replace(/\s+/g, "_"))} className={btn}>
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            disabled={!res}
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
          </button>
        </>
      }
      printHeader={
        <div className="mx-auto mb-3 hidden max-w-[1700px] items-stretch border-2 border-slate-800 print:flex">
          <div className="flex-1 border-r-2 border-slate-800 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-500">Memoria de cálculo · Viga continua pretensada</div>
            <div className="text-lg font-extrabold">{inp.project}</div>
            <div className="text-sm">{inp.element}</div>
          </div>
          <div className="p-3 text-xs">
            <div>
              <b>Norma:</b> ACI {inp.code}
            </div>
            <div>
              <b>Calculó:</b> {inp.author || "—"}
            </div>
            <div>
              <b>Fecha:</b> {today}
            </div>
          </div>
        </div>
      }
      aside={<ContinuousInputPanel inp={inp} set={set} res={res} />}
    >
      {!out.ok && (
        <div className="card flex gap-3 border-rose-300 bg-rose-50 p-4 text-rose-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-bold">Revisa los datos de entrada</div>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {out.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {res && maxR && (
        <>
          <section id="resumen">
            <SectionTitle eyebrow="01 · Resumen" title="Resultados generales" desc="Envolventes de cortante y momento, reacciones y estado global de la verificación a cortante y flexión." />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi icon={<Sigma className="h-4.5 w-4.5" />} label="Vu máximo" value={f2(res.VuMax)} unit="kip" sub={`${inp.gD}·D + ${inp.gL}·L`} tone="red" />
              <Kpi icon={<Activity className="h-4.5 w-4.5" />} label="Mu+ máximo" value={f2(res.MuPosMax, 1)} unit="kip·ft" sub={`φMn+ = ${f2(res.flex.phiMnPos, 1)}`} tone="blue" />
              <Kpi icon={<Activity className="h-4.5 w-4.5" />} label="Mu− máximo" value={f2(res.MuNegMax, 1)} unit="kip·ft" sub={`φMn− = ${f2(res.flex.phiMnNeg, 1)}`} tone="violet" />
              <Kpi icon={<ArrowDownToLine className="h-4.5 w-4.5" />} label="Reacción máx. Ru" value={f2(maxR.Rmax)} unit="kip" sub={`en el nodo ${nodeName(maxR.index)}`} tone="amber" />
              <Kpi icon={<Cable className="h-4.5 w-4.5" />} label="Ap torones" value={f2(res.ctx.Ap, 3)} unit="in²" sub={`fps = ${f2(res.flex.fps, 1)} ksi`} tone="slate" />
              <Kpi icon={<Layers className="h-4.5 w-4.5" />} label="Av estribos" value={f2(res.ctx.Av)} unit="in²" sub={`${inp.stirrupBar} × ${inp.legs} ramales`} tone="violet" />
              <Kpi icon={<Ruler className="h-4.5 w-4.5" />} label="S máx rige" value={f2(res.ctx.restr.governing)} unit="in" sub={res.ctx.restr.governingLabel} tone="amber" />
              <Kpi
                icon={res.allOk ? <ShieldCheck className="h-4.5 w-4.5" /> : <ShieldAlert className="h-4.5 w-4.5" />}
                label="Estado del diseño"
                value={res.allOk ? "CUMPLE" : "NO CUMPLE"}
                unit=""
                sub={res.allOk ? `${res.stirrupsTotal} estribos en la viga` : `cortante: ${res.failShear} · flexión: ${res.failFlex} sección(es)`}
                tone={res.allOk ? "green" : "red"}
              />
            </div>
            {res.warnings.length > 0 && (
              <div className="mt-3 space-y-2">
                {res.warnings.map((w) => (
                  <div key={w} className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="esquema">
            <SectionTitle eyebrow="02 · Esquema" title="Geometría, apoyos y cargas" />
            <ContinuousSchematic inp={inp} res={res} />
          </section>

          <section id="graficas" className="print-break">
            <SectionTitle eyebrow="03 · Diagramas" title="Envolventes de cortante y momento" desc="Resultado del análisis elástico por el método de rigidez, con los factores de carga y la alternancia de carga viva elegidos." />
            <ContinuousCharts inp={inp} res={res} />
          </section>

          <section id="tabla" className="print-break">
            <SectionTitle
              eyebrow="04 · Diseño por secciones"
              title="Tabla de cortante y flexión"
              desc="Vu con el momento concurrente (para Vc), separación de estribos y relación demanda/capacidad a flexión en cada sección de cada tramo."
            />
            <StationsTable res={res} inp={inp} />
          </section>

          <section id="apoyos" className="print-break">
            <SectionTitle eyebrow="05 · Apoyos y flexión" title="Reacciones, momentos de apoyo y capacidad a flexión" />
            <div className="space-y-4">
              <NodesTable res={res} inp={inp} />
              <div className="grid gap-4 lg:grid-cols-2">
                <FlexCapacityCard res={res} inp={inp} />
              </div>
            </div>
          </section>

          <section id="armado" className="print-break">
            <SectionTitle eyebrow="06 · Armado" title="Distribución de estribos por tramo" desc="En cada intervalo entre secciones rige la menor separación de sus dos extremos, porque el cortante puede crecer hacia el siguiente apoyo." />
            <ZonesTable res={res} inp={inp} />
          </section>
        </>
      )}

      <section id="notas">
        <SectionTitle eyebrow="07 · Alcance" title="Hipótesis y limitaciones" right={<ScrollText className="no-print h-6 w-6 text-slate-400" />} />
        <div className="card grid gap-5 p-5 text-sm leading-relaxed text-slate-700 md:grid-cols-2">
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-900">
              <Info className="h-4 w-4 text-blue-600" /> Qué calcula esta herramienta
            </h4>
            <ul className="list-disc space-y-1 pl-5">
              <li>Análisis elástico lineal por el método de rigidez de una viga de hasta 8 tramos, con EI relativo por tramo y extremos articulados, empotrados o en voladizo.</li>
              <li>Cargas uniformes muerta y viva por tramo y cargas puntuales. Se resuelve un caso para la carga muerta y uno por cada tramo con carga viva, y se superponen.</li>
              <li>Con alternancia de carga viva, la envolvente suma, en cada sección, sólo los tramos que aumentan el efecto (máx.) o lo disminuyen (mín.). El momento que acompaña al cortante máximo es el del mismo patrón.</li>
              <li>Cortante: mismo motor que la herramienta de viga simplemente apoyada (Vc simplificado, Vs, separación y límites). Entre el eje del apoyo y la sección crítica se usa el Vu de la sección crítica, medida desde la cara del apoyo.</li>
              <li>Flexión: φMn+ con la expresión aproximada de fps para pretensado adherido; φMn− con el acero ordinario superior. Se determina φ por deformación (tracción controlada → φ máx.).</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 font-bold text-amber-700">
              <AlertTriangle className="h-4 w-4" /> Consideraciones importantes
            </h4>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <b>No se incluyen los momentos secundarios del pretensado</b> (reacciones hiperestáticas) ni el trazado de los cables: en una viga continua pretensada pueden ser significativos y deben sumarse a Mu (ACI 318-19 §5.3.11).
              </li>
              <li>Las cargas son de servicio y se factorizan aquí; wD debe incluir el peso propio. No se redistribuyen momentos.</li>
              <li>La capacidad a flexión es constante en toda la viga (As superior e inferior sin cortes). No se verifican Mcr, refuerzo mínimo de flexión, esfuerzos de servicio, deflexiones ni longitudes de desarrollo.</li>
              <li>El método simplificado de Vc requiere pretensado efectivo ≥ 0.4 de la resistencia a tracción del refuerzo longitudinal; no se calculan Vci ni Vcw. Entre apoyo y sección crítica se asume reacción de compresión y ninguna carga puntual dentro de d.</li>
              <li>Con momento negativo en el apoyo, el cortante se verifica con |Mu| concurrente; no se considera el efecto de torones en la zona de tracción superior.</li>
              <li>Herramienta de apoyo: los resultados deben ser revisados por el ingeniero responsable.</li>
            </ul>
          </div>
        </div>
      </section>
    </ToolFrame>
  );
}
