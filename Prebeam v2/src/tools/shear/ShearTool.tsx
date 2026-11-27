import { useMemo } from "react";
import { AlertTriangle, BookOpenCheck, Info, ScrollText } from "lucide-react";
import InputPanel from "../../components/InputPanel";
import Kpis from "../../components/Kpis";
import ResultsTable from "../../components/ResultsTable";
import { BeamSchematic, ZonesSummary } from "../../components/BeamSchematic";
import Charts from "../../components/Charts";
import Memoria from "../../components/Memoria";
import ToolFrame, { Pill } from "../../components/ToolFrame";
import { Badge, SectionTitle } from "../../components/ui";
import InputIssues from "../../components/InputIssues";
import ToolActions from "../../components/ToolActions";
import { useToast } from "../../components/Toast";
import { blankInputs, calculate, DEFAULT_INPUTS, STIRRUP_BARS, type Inputs, type Result } from "../../lib/calc";
import { exportCsv } from "../../lib/export";
import { reviveInto, sameData, useHistory } from "../../lib/history";
import { exportShearXlsx } from "./exportXlsx";

const STORAGE_KEY = "prebeam-inputs-v1";
const cloneInputs = (i: Inputs): Inputs => ({ ...i, strands: i.strands.map((s) => ({ ...s })) });
/** Valida lo guardado en el navegador: lo que no tenga el formato esperado vuelve al valor por defecto */
const revive = (raw: unknown): Inputs | null => {
  const m = reviveInto(raw, DEFAULT_INPUTS);
  if (!m) return null;
  const strandsOk = m.strands.length > 0 && m.strands.every((s) => s && typeof s.type === "string" && typeof s.qty === "number" && isFinite(s.qty));
  return cloneInputs({
    ...m,
    strands: strandsOk ? m.strands : DEFAULT_INPUTS.strands,
    code: m.code === "318-99" ? "318-99" : "318-19",
    critical: m.critical === "h/2" || m.critical === "d" ? m.critical : "d/2",
    stirrupBar: m.stirrupBar in STIRRUP_BARS ? m.stirrupBar : DEFAULT_INPUTS.stirrupBar,
  });
};

const NAV = [{id:"resumen",label:"Resumen"},{id:"tabla",label:"Por secciones"},{id:"armado",label:"Armado"},{id:"graficas",label:"Gráficas"},{id:"memoria",label:"Memoria"},{id:"notas",label:"Alcance"}];
export default function ShearTool() {
  const history=useHistory<Inputs>(()=>cloneInputs(DEFAULT_INPUTS),{storageKey:STORAGE_KEY,revive});
  const {state:inp,set}=history;
  const toast=useToast();
  const out=useMemo(()=>calculate(inp),[inp]);
  const res:Result|null=out.ok?out:null;
  const isBlank=sameData(inp,blankInputs(inp.author));
  const undoAction={label:"Deshacer",onClick:history.undo};
  const loadExample=()=>{history.replace(cloneInputs(DEFAULT_INPUTS));toast.show("Ejemplo cargado.",{action:undoAction});};
  const reset=()=>{history.replace(blankInputs(inp.author));toast.show("Todos los datos están en 0. Puedes empezar de nuevo.",{action:undoAction});};
  const toExcel=()=>{
    if(!res)return;
    try{toast.show(`Excel exportado: ${exportShearXlsx(inp,res)}`);}catch{toast.show("No se pudo generar el archivo de Excel.");}
  };
  const actions=<ToolActions history={history} onExample={loadExample} onReset={reset} onExcel={toExcel} onCsv={()=>res&&exportCsv(res)} exportDisabled={!res}/>;
  const printHeader=<div className="hidden print:mb-4 print:block print:border-b print:border-black print:pb-3">
    <div className="text-xl font-black">PREBEAM · CORTANTE VERTICAL EN VIGAS PRETENSADAS</div>
    <div className="mt-2 grid grid-cols-3 gap-4 text-xs"><span><b>Proyecto:</b> {inp.project}</span><span><b>Elemento:</b> {inp.element}</span><span><b>Calculó:</b> {inp.author||"—"}</span></div>
    <div className="mt-1 text-[10px]">{inp.code==="318-19"?"ACI 318-19":"ACI 318-99"} · Unidades kip, ft, in · Resultados para revisión del ingeniero responsable.</div></div>;
  return <><ToolFrame nav={NAV} actions={actions} printHeader={printHeader}
    badges={<><Pill>{inp.code==="318-19"?"ACI 318-19":"ACI 318-99"}</Pill><Pill>Método simplificado Vc</Pill><Pill>Viga simplemente apoyada</Pill><Pill>Sistema inglés</Pill></>}
    aside={<InputPanel inp={inp} set={set} res={res}/>}>
    {!out.ok&&<InputIssues errors={out.errors} blank={isBlank} onExample={loadExample}/>}
    {res&&<>
      <section id="resumen" className="section-block scroll-mt-36"><SectionTitle eyebrow="01 · Resumen" title="Resultados generales" desc="Parámetros clave de la viga, cargas factorizadas y estado global de la verificación."/><Kpis inp={inp} res={res}/>
        {res.warnings.length>0&&<div className="mt-3 space-y-2">{res.warnings.map((w)=><p key={w} className="flex gap-2 rounded-lg border border-[#e7d185] bg-[#fff6d9] px-3 py-2.5 text-[11px] leading-relaxed text-[#765b08]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/>{w}</p>)}</div>}</section>
      <section id="tabla" className="section-block scroll-mt-36"><SectionTitle eyebrow="02 · Diseño por secciones" title="Tabla de cortante vertical" desc="Vu, Mu, Vc, Vs y separación de estribos en cada sección a lo largo de la semi-luz."/><ResultsTable res={res} inp={inp}/></section>
      <section id="armado" className="section-block print-break scroll-mt-36"><SectionTitle eyebrow="03 · Armado" title="Distribución de estribos" desc="Zonas de separación constante, cantidad de estribos y restricciones de separación máxima."/><div className="space-y-4"><BeamSchematic inp={inp} res={res}/><ZonesSummary inp={inp} res={res}/></div></section>
      <section id="graficas" className="section-block print-break scroll-mt-36"><SectionTitle eyebrow="04 · Gráficas" title="Diagramas de cortante, momento y separación"/><Charts inp={inp} res={res}/></section>
      <section id="memoria" className="section-block print-break scroll-mt-36"><SectionTitle eyebrow="05 · Memoria de cálculo" title="Procedimiento paso a paso" desc="Sustitución numérica de las ecuaciones del ACI para la sección elegida." right={<BookOpenCheck className="no-print h-6 w-6 text-[#718e31]"/>}/><Memoria inp={inp} res={res}/></section>
    </>}
    <section id="notas" className="section-block scroll-mt-36"><SectionTitle eyebrow="06 · Alcance" title="Hipótesis y limitaciones" right={<ScrollText className="no-print h-6 w-6 text-slate-400"/>}/>
      <div className="card grid gap-7 p-5 text-xs leading-relaxed text-slate-600 md:grid-cols-2 lg:p-6"><div><h4 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-[#111310]"><Info className="h-4 w-4 text-[#718e31]"/>Qué calcula esta herramienta</h4>
        <ul className="list-disc space-y-2 pl-5"><li>Viga simplemente apoyada con carga uniforme y camión opcional con las ecuaciones de la hoja original.</li><li>Vc por el método simplificado: Vc = (0.6λ√f'c + 700·Vu·d/Mu)·bw·d, con Vu·d/Mu ≤ 1.0, acotado entre 2√f'c·bw·d y 5√f'c·bw·d.</li><li>Estribos: s = Av·fy·d/Vs, limitada por d/2, 24 in, 3H/4 y los mínimos de Av para concreto pretensado.</li><li>Verificación de Vs ≤ 8√f'c·bw·d y de φVn ≥ Vu con la separación redondeada.</li></ul></div>
        <div><h4 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-[#9a4a0b]"><AlertTriangle className="h-4 w-4"/>Consideraciones importantes</h4>
          <ul className="list-disc space-y-2 pl-5"><li>El método simplificado requiere fuerza efectiva de pretensado ≥ 0.4 de la resistencia a tracción del acero longitudinal. No se calculan Vci ni Vcw.</li><li>El peralte d se toma constante, sin trazado harped de torones ni variación de excentricidad.</li><li>La hoja original usa ACI 318-99. Esta app usa ACI 318-19 por defecto; «Hoja Excel» reproduce los factores originales.</li><li>Donde φVs ≤ 0 pero Vu &gt; φVc/2 se aplica S máx por refuerzo mínimo.</li><li><b>Herramienta de apoyo:</b> los resultados deben ser revisados por el ingeniero responsable.</li></ul></div></div>
      <div className="mt-3 flex flex-wrap gap-2"><Badge tone="blue">Revisión profesional requerida</Badge><Badge>No sustituye el juicio de ingeniería</Badge></div></section>
  </ToolFrame>{toast.node}</>;
}
