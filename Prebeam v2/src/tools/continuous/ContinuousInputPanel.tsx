import { Anchor, Boxes, Cable, ClipboardList, FlaskConical, GitBranch, Plus, Ruler, Trash2, Weight, Zap } from "lucide-react";
import { CODE_PRESETS, STIRRUP_BARS, STRAND_TYPES, strandArea, type Code, type CriticalRule } from "../../lib/calc";
import { ActionButton, NumField, PanelGroup, SelectField, TextField, Toggle } from "../../components/ui";
import type { ContinuousInputs, ContinuousResult, EndCond, PointLoad, Span } from "./engine";

const endOptions=[{value:"pinned",label:"Articulado / apoyo"},{value:"fixed",label:"Empotrado"},{value:"free",label:"Libre · voladizo"}];
export default function ContinuousInputPanel({inp,set,res}:{inp:ContinuousInputs;set:(p:Partial<ContinuousInputs>)=>void;res:ContinuousResult|null}) {
  const setSpan=(i:number,patch:Partial<Span>)=>set({spans:inp.spans.map((s,k)=>k===i?{...s,...patch}:s)});
  const addSpan=()=>{if(inp.spans.length>=8)return;const last=inp.spans[inp.spans.length-1];set({spans:[...inp.spans,{...last}]});};
  const removeSpan=(i:number)=>{if(inp.spans.length<=1)return;set({spans:inp.spans.filter((_,k)=>k!==i),points:inp.points.filter((p)=>p.span!==i).map((p)=>p.span>i?{...p,span:p.span-1}:p)});};
  const setPoint=(i:number,patch:Partial<PointLoad>)=>set({points:inp.points.map((p,k)=>k===i?{...p,...patch}:p)});
  const setStrand=(i:number,patch:Partial<{type:string;qty:number}>)=>set({strands:inp.strands.map((s,k)=>k===i?{...s,...patch}:s)});
  const Ap=strandArea(inp.strands),Av=(STIRRUP_BARS[inp.stirrupBar]?.area??0)*inp.legs;
  return <div className="card overflow-hidden border-[#111310]">
    <div className="flex items-center gap-2 border-b border-[#111310] bg-[#191c16] px-4 py-4 text-white"><ClipboardList className="h-4 w-4 text-[#c7f36b]"/><h2 className="text-xs font-extrabold uppercase tracking-[.08em]">Modelo y datos</h2><span className="ml-auto font-mono text-[8px] text-white/45">{inp.spans.length}/8 TRAMOS</span></div>
    <PanelGroup title="Proyecto" icon={<Boxes className="h-3.5 w-3.5"/>} tone="slate"><TextField label="Proyecto" value={inp.project} onChange={(v)=>set({project:v})}/>
      <div className="grid grid-cols-2 gap-3"><TextField label="Elemento" value={inp.element} onChange={(v)=>set({element:v})}/><TextField label="Calculó" value={inp.author} onChange={(v)=>set({author:v})} placeholder="Ing."/></div></PanelGroup>
    <PanelGroup title="Tramos y cargas distribuidas" icon={<GitBranch className="h-3.5 w-3.5"/>}>
      {inp.spans.map((s,i)=><div key={i} className="rounded-lg border border-[#d3d7c9] bg-[#f5f6ef] p-3">
        <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide"><span className="flex h-5 w-5 items-center justify-center rounded bg-[#111310] font-mono text-[9px] text-[#c7f36b]">{i+1}</span>Tramo {i+1}</span>
          <button type="button" disabled={inp.spans.length<=1} onClick={()=>removeSpan(i)} className="rounded p-1 text-slate-400 transition hover:bg-[#fff0eb] hover:text-[#b52e0d] disabled:opacity-25" aria-label={`Eliminar tramo ${i+1}`}><Trash2 className="h-3.5 w-3.5"/></button></div>
        <div className="grid grid-cols-2 gap-2"><NumField label="Luz L" unit="ft" value={s.L} onChange={(v)=>setSpan(i,{L:v})}/><NumField label="EI relativo" value={s.EIrel} onChange={(v)=>setSpan(i,{EIrel:v})}/>
          <NumField label="w muerta" unit="k/ft" value={s.wD} onChange={(v)=>setSpan(i,{wD:v})}/><NumField label="w viva" unit="k/ft" value={s.wL} onChange={(v)=>setSpan(i,{wL:v})}/></div></div>)}
      <ActionButton className="w-full" onClick={addSpan} disabled={inp.spans.length>=8}><Plus className="h-3.5 w-3.5"/>{inp.spans.length>=8?"Máximo 8 tramos":"Añadir tramo"}</ActionButton>
      <div className="grid grid-cols-2 gap-3"><SelectField label="Extremo izquierdo" value={inp.leftEnd} onChange={(v)=>set({leftEnd:v as EndCond})} options={endOptions}/><SelectField label="Extremo derecho" value={inp.rightEnd} onChange={(v)=>set({rightEnd:v as EndCond})} options={endOptions}/></div>
      <Toggle checked={inp.pattern} onChange={(v)=>set({pattern:v})} label="Alternancia de carga viva" hint="Genera envolventes activando cada tramo por separado y sumando solo los efectos favorables a cada máximo o mínimo."/>
    </PanelGroup>
    <PanelGroup title="Cargas puntuales" icon={<Zap className="h-3.5 w-3.5"/>} tone="red">
      {inp.points.length===0&&<p className="rounded-lg border border-dashed border-[#c9cdbf] p-3 text-center text-[10px] leading-relaxed text-slate-500">Sin cargas puntuales. Añade una para incluirla en el análisis por rigidez y en las estaciones de diseño.</p>}
      {inp.points.map((p,i)=><div key={i} className="rounded-lg border border-[#edcfc3] bg-[#fff7f3] p-3"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-extrabold uppercase">P{i+1}</span><button type="button" onClick={()=>set({points:inp.points.filter((_,k)=>k!==i)})} className="text-[#b52e0d]" aria-label={`Eliminar carga ${i+1}`}><Trash2 className="h-3.5 w-3.5"/></button></div>
        <div className="grid grid-cols-2 gap-2"><SelectField label="Tramo" value={String(p.span)} onChange={(v)=>setPoint(i,{span:parseInt(v)})} options={inp.spans.map((_,k)=>({value:String(k),label:`Tramo ${k+1}`}))}/><SelectField label="Tipo" value={p.kind} onChange={(v)=>setPoint(i,{kind:v as "D"|"L"})} options={[{value:"D",label:"Muerta D"},{value:"L",label:"Viva L"}]}/>
          <NumField label="Posición a" unit="ft" value={p.a} onChange={(v)=>setPoint(i,{a:v})} hint={`máx ${inp.spans[p.span]?.L??0}`}/><NumField label="Carga P" unit="kip" value={p.P} onChange={(v)=>setPoint(i,{P:v})}/></div></div>)}
      <ActionButton className="w-full" onClick={()=>set({points:[...inp.points,{span:0,a:inp.spans[0].L/2,P:10,kind:"L"}]})}><Plus className="h-3.5 w-3.5"/>Añadir carga puntual</ActionButton>
    </PanelGroup>
    <PanelGroup title="Norma y materiales" icon={<FlaskConical className="h-3.5 w-3.5"/>} tone="green">
      <SelectField label="Norma" value={inp.code} onChange={(v)=>set({code:v as Code,...CODE_PRESETS[v as Code]})} options={[{value:"318-19",label:"ACI 318-19 · 1.2D+1.6L"},{value:"318-99",label:"ACI 318-99 · 1.4D+1.7L"}]}/>
      <div className="grid grid-cols-3 gap-2"><NumField label="φ cortante" value={inp.phi} onChange={(v)=>set({phi:v})}/><NumField label="γ D" value={inp.gD} onChange={(v)=>set({gD:v})}/><NumField label="γ L" value={inp.gL} onChange={(v)=>set({gL:v})}/></div>
      <div className="grid grid-cols-2 gap-3"><NumField label="f'c" unit="psi" value={inp.fc} onChange={(v)=>set({fc:v})}/><NumField label="λ" value={inp.lambda} onChange={(v)=>set({lambda:v})}/><NumField label="fy estribos" unit="ksi" value={inp.fy} onChange={(v)=>set({fy:v})}/><NumField label="fpu" unit="ksi" value={inp.fpu} onChange={(v)=>set({fpu:v})}/></div>
    </PanelGroup>
    <PanelGroup title="Sección y cortante" icon={<Ruler className="h-3.5 w-3.5"/>}>
      <div className="grid grid-cols-2 gap-3"><NumField label="Peralte d" unit="in" value={inp.d} onChange={(v)=>set({d:v})} hint={res?`real ${res.ctx.dReal.toFixed(2)}`:undefined}/><NumField label="Altura H" unit="in" value={inp.h} onChange={(v)=>set({h:v})}/><NumField label="Ancho bw" unit="in" value={inp.bw} onChange={(v)=>set({bw:v})}/><NumField label="Ancho apoyo" unit="in" value={inp.supportWidth} onChange={(v)=>set({supportWidth:v})}/></div>
      <SelectField label="Sección crítica desde cara" value={inp.critical} onChange={(v)=>set({critical:v as CriticalRule})} options={[{value:"d/2",label:"d/2"},{value:"h/2",label:"h/2 · pretensado"},{value:"d",label:"d"}]}/>
      <div className="grid grid-cols-2 gap-3"><NumField label="Paso" unit="ft" value={inp.step} onChange={(v)=>set({step:v})}/><NumField label="Redondeo S" unit="in" value={inp.rounding} onChange={(v)=>set({rounding:v})}/></div>
      <Toggle checked={inp.halveSpacing} onChange={(v)=>set({halveSpacing:v})} label="Reducir S máx si Vs > 4√f'c·bw·d"/>
    </PanelGroup>
    <PanelGroup title="Pretensado y estribos" icon={<Cable className="h-3.5 w-3.5"/>} tone="blue">
      {inp.strands.map((s,i)=><div key={i} className="grid grid-cols-[1fr_72px] gap-2"><SelectField label={i===0?"Torón":undefined} value={s.type} onChange={(v)=>setStrand(i,{type:v})} options={Object.entries(STRAND_TYPES).map(([k,v])=>({value:k,label:`${v.label} · ${v.area}`}))}/><NumField label={i===0?"Cant.":" "} value={s.qty} onChange={(v)=>setStrand(i,{qty:Math.max(0,Math.round(v))})}/></div>)}
      <div className="grid grid-cols-2 gap-3"><SelectField label="Barra estribo" value={inp.stirrupBar} onChange={(v)=>set({stirrupBar:v})} options={Object.entries(STIRRUP_BARS).map(([k,v])=>({value:k,label:`${v.label} · ${v.area}`}))}/><NumField label="Ramales" value={inp.legs} onChange={(v)=>set({legs:Math.max(1,Math.round(v))})}/></div>
      <div className="flex justify-between rounded-md bg-[#eef6d9] px-3 py-2 font-mono text-[10px]"><span>Ap {Ap.toFixed(3)} in²</span><span>Av {Av.toFixed(2)} in²</span></div>
    </PanelGroup>
    <PanelGroup title="Flexión positiva" icon={<Weight className="h-3.5 w-3.5"/>} tone="green">
      <div className="grid grid-cols-2 gap-3"><NumField label="φ flexión máx." value={inp.phiF} onChange={(v)=>set({phiF:v})}/><NumField label="fy long." unit="ksi" value={inp.fyL} onChange={(v)=>set({fyL:v})}/><NumField label="bf compresión" unit="in" value={inp.bf} onChange={(v)=>set({bf:v})}/><NumField label="hf ala" unit="in" value={inp.hf} onChange={(v)=>set({hf:v})}/><NumField label="dp torones" unit="in" value={inp.dp} onChange={(v)=>set({dp:v})}/><NumField label="fse efectivo" unit="ksi" value={inp.fse} onChange={(v)=>set({fse:v})}/></div>
      <NumField label="As inferior ordinario" unit="in²" value={inp.asBot} onChange={(v)=>set({asBot:v})}/>
    </PanelGroup>
    <PanelGroup title="Flexión negativa" icon={<Anchor className="h-3.5 w-3.5"/>} tone="red">
      <NumField label="As superior ordinario" unit="in²" value={inp.asTop} onChange={(v)=>set({asTop:v})}/><div className="grid grid-cols-2 gap-3"><NumField label="d negativo" unit="in" value={inp.dNeg} onChange={(v)=>set({dNeg:v})}/><NumField label="b negativo" unit="in" value={inp.bNeg} onChange={(v)=>set({bNeg:v})}/></div>
    </PanelGroup>
  </div>;
}
