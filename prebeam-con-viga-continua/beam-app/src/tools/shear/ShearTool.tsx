import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpenCheck, Download, FileSpreadsheet, Info, Printer, RotateCcw, ScrollText } from "lucide-react";
import { calculate, DEFAULT_INPUTS, EXCEL_INPUTS, type Inputs, type Result } from "../../lib/calc";
import { exportCsv } from "../../lib/export";
import InputPanel from "../../components/InputPanel";
import Kpis from "../../components/Kpis";
import ResultsTable, { RestrictionsTable } from "../../components/ResultsTable";
import { BeamSchematic, ZonesSummary } from "../../components/BeamSchematic";
import Charts from "../../components/Charts";
import Memoria from "../../components/Memoria";
import { SectionTitle } from "../../components/ui";
import ToolFrame, { Pill } from "../../components/ToolFrame";

const STORAGE_KEY = "prebeam-inputs-v1";

function loadInputs(): Inputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_INPUTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_INPUTS;
}

const nav = [
  { id: "resumen", label: "Resumen" },
  { id: "tabla", label: "Tabla de diseño" },
  { id: "armado", label: "Armado" },
  { id: "graficas", label: "Gráficas" },
  { id: "memoria", label: "Memoria de cálculo" },
  { id: "notas", label: "Alcance" },
];

export default function ShearTool() {
  const [inp, setInp] = useState<Inputs>(loadInputs);
  const set = (patch: Partial<Inputs>) => setInp((p) => ({ ...p, ...patch }));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inp));
    } catch {
      /* ignore */
    }
  }, [inp]);

  const out = useMemo(() => calculate(inp), [inp]);
  const res: Result | null = out.ok ? out : null;
  const today = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40";

  return (
    <ToolFrame
      nav={nav}
      badges={
        <>
          <Pill>{inp.code === "318-19" ? "ACI 318-19 · φ = " + inp.phi : "ACI 318-99 · modo hoja Excel · φ = " + inp.phi}</Pill>
          <Pill>Sistema inglés (kip · ft · in)</Pill>
          <Pill>Cálculo en tiempo real</Pill>
        </>
      }
      actions={
        <>
          <button onClick={() => setInp(EXCEL_INPUTS)} className={btn} title="Carga los datos de tu hoja con ACI 318-99 (φ=0.85, 1.4D+1.7L)">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Reproducir hoja Excel
          </button>
          <button onClick={() => setInp(DEFAULT_INPUTS)} className={btn}>
            <RotateCcw className="h-3.5 w-3.5" /> Datos de ejemplo
          </button>
          <button disabled={!res} onClick={() => res && exportCsv(res, (inp.element || "cortante").replace(/\s+/g, "_"))} className={btn}>
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
            <div className="text-[10px] font-bold uppercase text-slate-500">Memoria de cálculo · Cortante vertical en viga pretensada</div>
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
      aside={<InputPanel inp={inp} set={set} res={res} />}
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

      {res && (
        <>
          <section id="resumen">
            <SectionTitle eyebrow="01 · Resumen" title="Resultados generales" desc="Parámetros clave de la viga, cargas factorizadas y estado global de la verificación." />
            <Kpis inp={inp} res={res} />
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

          <section id="tabla">
            <SectionTitle
              eyebrow="02 · Diseño por secciones"
              title="Tabla de cortante vertical"
              desc="Equivalente a tu hoja de Excel: Vu, Mu, Vc, Vs y separación de estribos en cada sección a lo largo de la semi-luz."
            />
            <ResultsTable res={res} inp={inp} />
          </section>

          <section id="armado" className="print-break">
            <SectionTitle eyebrow="03 · Armado" title="Distribución de estribos" desc="Zonas de separación constante, cantidad de estribos y restricciones de separación máxima." />
            <div className="space-y-4">
              <BeamSchematic inp={inp} res={res} />
              <div className="grid gap-4 lg:grid-cols-2">
                <ZonesSummary inp={inp} res={res} />
                <RestrictionsTable res={res} inp={inp} />
              </div>
            </div>
          </section>

          <section id="graficas" className="print-break">
            <SectionTitle eyebrow="04 · Gráficas" title="Diagramas de cortante, momento y separación" />
            <Charts inp={inp} res={res} />
          </section>

          <section id="memoria" className="print-break">
            <SectionTitle
              eyebrow="05 · Memoria de cálculo"
              title="Procedimiento paso a paso"
              desc="Sustitución numérica de las ecuaciones del ACI para la sección elegida."
              right={<BookOpenCheck className="no-print h-6 w-6 text-blue-500" />}
            />
            <Memoria inp={inp} res={res} />
          </section>
        </>
      )}

      <section id="notas">
        <SectionTitle eyebrow="06 · Alcance" title="Hipótesis y limitaciones" right={<ScrollText className="no-print h-6 w-6 text-slate-400" />} />
        <div className="card grid gap-5 p-5 text-sm leading-relaxed text-slate-700 md:grid-cols-2">
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-900">
              <Info className="h-4 w-4 text-blue-600" /> Qué calcula esta herramienta
            </h4>
            <ul className="list-disc space-y-1 pl-5">
              <li>Viga simplemente apoyada con carga uniforme (y camión opcional con las ecuaciones de tu hoja).</li>
              <li>Vc por el método simplificado: Vc = (0.6λ√f'c + 700·Vu·d/Mu)·bw·d, con Vu·d/Mu ≤ 1.0, acotado entre 2√f'c·bw·d y 5√f'c·bw·d.</li>
              <li>Estribos: s = Av·fy·d / Vs, limitada por d/2, 24 in, 3H/4 y los mínimos de Av para concreto pretensado.</li>
              <li>Verificación de Vs ≤ 8√f'c·bw·d y de φVn ≥ Vu con la separación redondeada.</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 font-bold text-amber-700">
              <AlertTriangle className="h-4 w-4" /> Consideraciones importantes
            </h4>
            <ul className="list-disc space-y-1 pl-5">
              <li>El método simplificado requiere fuerza efectiva de pretensado ≥ 0.4 de la resistencia a tracción del acero de refuerzo longitudinal. No se calculan Vci ni Vcw.</li>
              <li>El peralte d se toma constante (sin trazado harped de torones ni variación de excentricidad).</li>
              <li>
                La hoja original usa ACI 318-99 (φ = 0.85, 1.4D + 1.7L). Esta app usa por defecto ACI 318-19 (φ = 0.75, 1.2D + 1.6L); el botón «Reproducir hoja Excel» replica tus valores.
              </li>
              <li>Donde φVs ≤ 0 pero Vu &gt; φVc/2, se aplica S máx (refuerzo mínimo); la hoja mostraba 0 en esas filas.</li>
              <li>Herramienta de apoyo: los resultados deben ser revisados por el ingeniero responsable.</li>
            </ul>
          </div>
        </div>
      </section>
    </ToolFrame>
  );
}
