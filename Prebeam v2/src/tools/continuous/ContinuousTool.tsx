import { useMemo } from "react";
import { Activity, AlertTriangle, ArrowDownToLine, Cable, GitBranch, Info, Layers, Ruler, ScrollText, ShieldAlert, ShieldCheck, Sigma } from "lucide-react";
import ToolFrame, { Pill } from "../../components/ToolFrame";
import { Badge, SectionTitle } from "../../components/ui";
import InputIssues from "../../components/InputIssues";
import ToolActions from "../../components/ToolActions";
import { useToast } from "../../components/Toast";
import { STIRRUP_BARS } from "../../lib/calc";
import { reviveInto, sameData, useHistory } from "../../lib/history";
import { Kpi } from "../../components/Kpis";
import ContinuousInputPanel from "./ContinuousInputPanel";
import ContinuousSchematic from "./ContinuousSchematic";
import ContinuousCharts from "./ContinuousCharts";
import { FlexSummary, NodesTable, StationsTable, ZonesTable } from "./ContinuousTables";
import { blankContinuous, calculateContinuous, DEFAULT_CONTINUOUS, type ContinuousInputs, type ContinuousResult } from "./engine";
import { exportContinuousCsv } from "./export";
import { exportContinuousXlsx } from "./exportXlsx";
import { f2, nodeName } from "./format";

const STORAGE_KEY = "prebeam-continuous-v1";
const MAX_SPANS = 8;
const cloneC = (i: ContinuousInputs): ContinuousInputs => ({ ...i, spans: i.spans.map((s) => ({ ...s })), strands: i.strands.map((s) => ({ ...s })), points: i.points.map((p) => ({ ...p })) });
const isNum = (v: unknown) => typeof v === "number" && isFinite(v);
const END = ["pinned", "fixed", "free"];
/** Valida lo guardado en el navegador: lo que no tenga el formato esperado vuelve al valor por defecto */
const revive = (raw: unknown): ContinuousInputs | null => {
  const m = reviveInto(raw, DEFAULT_CONTINUOUS);
  if (!m) return null;
  const spansOk = m.spans.length > 0 && m.spans.length <= MAX_SPANS && m.spans.every((s) => s && isNum(s.L) && isNum(s.EIrel) && isNum(s.wD) && isNum(s.wL));
  const pointsOk = m.points.every((p) => p && isNum(p.span) && isNum(p.a) && isNum(p.P) && (p.kind === "D" || p.kind === "L"));
  const strandsOk = m.strands.length > 0 && m.strands.every((s) => s && typeof s.type === "string" && isNum(s.qty));
  return cloneC({
    ...m,
    spans: spansOk ? m.spans : DEFAULT_CONTINUOUS.spans,
    points: pointsOk ? m.points : [],
    strands: strandsOk ? m.strands : DEFAULT_CONTINUOUS.strands,
    code: m.code === "318-99" ? "318-99" : "318-19",
    critical: m.critical === "d/2" || m.critical === "d" ? m.critical : "h/2",
    leftEnd: END.includes(m.leftEnd) ? m.leftEnd : "pinned",
    rightEnd: END.includes(m.rightEnd) ? m.rightEnd : "pinned",
    stirrupBar: m.stirrupBar in STIRRUP_BARS ? m.stirrupBar : DEFAULT_CONTINUOUS.stirrupBar,
  });
};

const NAV=[{id:"resumen",label:"Resumen"},{id:"modelo",label:"Modelo y apoyos"},{id:"secciones",label:"Por secciones"},{id:"envolventes",label:"Envolventes"},{id:"armado",label:"Armado"},{id:"notas",label:"Alcance"}];
export default function ContinuousTool() {
  const history=useHistory<ContinuousInputs>(()=>cloneC(DEFAULT_CONTINUOUS),{storageKey:STORAGE_KEY,revive});
  const {state:inp,set}=history;
  const toast=useToast();
  const out=useMemo(()=>calculateContinuous(inp),[inp]);
  const res:ContinuousResult|null=out.ok?out:null;
  const maxR=res?res.nodes.reduce((a,b)=>b.Rmax>a.Rmax?b:a,res.nodes[0]):null;
  const isBlank=sameData(inp,blankContinuous(inp.author));
  const undoAction={label:"Deshacer",onClick:history.undo};
  const loadExample=()=>{history.replace(cloneC(DEFAULT_CONTINUOUS));toast.show("Ejemplo cargado.",{action:undoAction});};
  const reset=()=>{history.replace(blankContinuous(inp.author));toast.show("Todos los datos están en 0. Puedes empezar de nuevo.",{action:undoAction});};
  const toExcel=()=>{
    if(!res)return;
    try{toast.show(`Excel exportado: ${exportContinuousXlsx(inp,res)}`);}catch{toast.show("No se pudo generar el archivo de Excel.");}
  };
  const actions=<ToolActions history={history} onExample={loadExample} onReset={reset} onExcel={toExcel} onCsv={()=>res&&exportContinuousCsv(res)} exportDisabled={!res}/>;
  const printHeader=<div className="hidden print:mb-4 print:block print:border-b print:border-black print:pb-3"><div className="text-xl font-black">PREBEAM · VIGA CONTINUA PRETENSADA</div><div className="mt-2 grid grid-cols-3 gap-4 text-xs"><span><b>Proyecto:</b> {inp.project}</span><span><b>Elemento:</b> {inp.element}</span><span><b>Calculó:</b> {inp.author||"—"}</span></div><div className="mt-1 text-[10px]">{inp.code} · {inp.spans.length} tramos · {inp.pattern?"envolvente con carga viva alternada":"carga viva uniforme"} · Unidades kip, ft, in.</div></div>;
  return <><ToolFrame nav={NAV} actions={actions} printHeader={printHeader} badges={<><Pill>{inp.code==="318-19"?"ACI 318-19":"ACI 318-99"}</Pill><Pill>Método de rigidez</Pill><Pill>{inp.spans.length} tramos · {res?.rows.length??0} estaciones</Pill><Pill>{inp.pattern?"Envolvente alternada":"Carga viva plena"}</Pill></>} aside={<ContinuousInputPanel inp={inp} set={set} res={res}/>}>
    {!out.ok&&<InputIssues errors={out.errors} blank={isBlank} onExample={loadExample}/>}
    {res&&maxR&&<>
      <section id="resumen" className="section-block scroll-mt-36"><SectionTitle eyebrow="01 · Resumen" title="Resultados generales" desc="Demandas máximas, capacidades y estado global de la verificación a cortante y flexión."/>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
          <Kpi icon={<Sigma className="h-4 w-4"/>} label="Vu máximo" value={f2(res.VuMax)} unit="kip" sub={`${inp.gD}·D + ${inp.gL}·L`} tone="red"/>
          <Kpi icon={<Activity className="h-4 w-4"/>} label="Mu+ máximo" value={f2(res.MuPosMax,1)} unit="kip·ft" sub={`φMn+ = ${f2(res.flex.phiMnPos,1)}`} tone="blue"/>
          <Kpi icon={<GitBranch className="h-4 w-4"/>} label="Mu− máximo" value={f2(res.MuNegMax,1)} unit="kip·ft" sub={`φMn− = ${f2(res.flex.phiMnNeg,1)}`} tone="violet"/>
          <Kpi icon={<ArrowDownToLine className="h-4 w-4"/>} label="Reacción máx. Ru" value={f2(maxR.Rmax)} unit="kip" sub={`en el nodo ${nodeName(maxR.index)}`} tone="amber"/>
          <Kpi icon={<Cable className="h-4 w-4"/>} label="Ap torones" value={f2(res.ctx.Ap,3)} unit="in²" sub={`fps = ${f2(res.flex.fps,1)} ksi`} tone="slate"/>
          <Kpi icon={<Layers className="h-4 w-4"/>} label="Av estribos" value={f2(res.ctx.Av)} unit="in²" sub={`${inp.stirrupBar} × ${inp.legs} ramales`} tone="violet"/>
          <Kpi icon={<Ruler className="h-4 w-4"/>} label="S máx rige" value={f2(res.ctx.restr.governing)} unit="in" sub={res.ctx.restr.governingLabel} tone="amber"/>
          <Kpi icon={res.allOk?<ShieldCheck className="h-4 w-4"/>:<ShieldAlert className="h-4 w-4"/>} label="Estado del diseño" value={res.allOk?"CUMPLE":"NO CUMPLE"} unit="" sub={res.allOk?`${res.stirrupsTotal} estribos en la viga`:`cortante ${res.failShear} · flexión ${res.failFlex}`} tone={res.allOk?"green":"red"}/>
        </div>{res.warnings.length>0&&<div className="mt-3 space-y-2">{res.warnings.map((w)=><p key={w} className="flex gap-2 rounded-lg border border-[#e7d185] bg-[#fff6d9] px-3 py-2.5 text-[11px] leading-relaxed text-[#765b08]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/>{w}</p>)}</div>}</section>
      <section id="modelo" className="section-block print-break scroll-mt-36"><SectionTitle eyebrow="02 · Modelo estructural" title="Geometría, cargas y apoyos" desc="Rigidez relativa por tramo, acciones aplicadas y reacciones en cada nodo."/><div className="space-y-4"><ContinuousSchematic inp={inp} res={res}/><NodesTable inp={inp} res={res}/></div></section>
      <section id="secciones" className="section-block print-break scroll-mt-36"><SectionTitle eyebrow="03 · Diseño por secciones" title="Cortante y flexión" desc="Demandas concurrentes, separaciones de estribos y relaciones demanda/capacidad en todas las estaciones."/><StationsTable res={res}/></section>
      <section id="envolventes" className="section-block print-break scroll-mt-36"><SectionTitle eyebrow="04 · Envolventes" title="Diagramas de cortante y momento" desc="Casos de carga muerta y viva superpuestos para obtener los efectos máximos y mínimos."/><ContinuousCharts res={res}/><div className="mt-4"><FlexSummary res={res}/></div></section>
      <section id="armado" className="section-block print-break scroll-mt-36"><SectionTitle eyebrow="05 · Armado" title="Zonas de estribos" desc="Separación gobernante y número de estribos por intervalo y tramo."/><ZonesTable res={res}/></section>
    </>}
    <section id="notas" className="section-block scroll-mt-36"><SectionTitle eyebrow="06 · Alcance" title="Hipótesis y limitaciones" right={<ScrollText className="no-print h-6 w-6 text-slate-400"/>}/>
      <div className="card grid gap-7 p-5 text-xs leading-relaxed text-slate-600 md:grid-cols-2 lg:p-6"><div><h4 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-[#111310]"><Info className="h-4 w-4 text-[#718e31]"/>Qué calcula esta herramienta</h4><ul className="list-disc space-y-2 pl-5">
        <li>Análisis elástico lineal por rigidez de una viga de hasta 8 tramos, con EI relativo y extremos articulados, empotrados o libres.</li><li>Cargas uniformes muerta y viva por tramo y cargas puntuales; un caso para D y uno por cada tramo de L.</li><li>Con alternancia, la envolvente suma solo los tramos que aumentan o disminuyen cada efecto. El momento que acompaña al cortante máximo pertenece al mismo patrón.</li><li>Cortante con el mismo motor de viga simple. Entre apoyo y sección crítica se adopta el Vu de la sección crítica, medida desde la cara.</li><li>Flexión: φMn+ con fps aproximado para pretensado adherido; φMn− con acero ordinario superior. φ se determina por deformación.</li></ul></div>
      <div><h4 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-[#9a4a0b]"><AlertTriangle className="h-4 w-4"/>Consideraciones importantes</h4><ul className="list-disc space-y-2 pl-5">
        <li>No incluye momentos secundarios del pretensado ni trazado de cables; pueden ser significativos y deben sumarse a Mu (ACI 318-19 §5.3.11).</li><li>Las cargas son de servicio y se factorizan aquí; wD incluye peso propio. No se redistribuyen momentos.</li><li>La capacidad a flexión es constante y sin cortes de acero. No se verifican Mcr, refuerzo mínimo, servicio, deflexiones ni desarrollo.</li><li>El método simplificado de Vc no calcula Vci ni Vcw. Entre apoyo y sección crítica se asume reacción de compresión y ninguna carga puntual dentro de d.</li><li>Con momento negativo se verifica cortante con |Mu| concurrente; no se considera el efecto de torones en la zona de tracción superior.</li><li><b>Herramienta de apoyo:</b> los resultados deben ser revisados por el ingeniero responsable.</li></ul></div></div>
      <div className="mt-3 flex flex-wrap gap-2"><Badge tone="blue">Análisis elástico lineal</Badge><Badge>Momentos secundarios no incluidos</Badge><Badge tone="amber">Revisión profesional requerida</Badge></div></section>
  </ToolFrame>{toast.node}</>;
}
