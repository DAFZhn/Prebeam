import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo, useState, type ReactNode } from "react";
import type { Inputs, Result } from "../lib/calc";
import { STIRRUP_BARS } from "../lib/calc";
import { Badge } from "./ui";

function Tex({ children }: { children: string }) {
  const html=useMemo(()=>katex.renderToString(children,{throwOnError:false,displayMode:true,output:"html"}),[children]);
  return <div className="scroll-thin overflow-x-auto py-1" dangerouslySetInnerHTML={{__html:html}}/>;
}
function Step({ n, title, refText, children }: { n:number; title:string; refText?:string; children:ReactNode }) {
  return <div className="card break-inside-avoid p-4"><div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#e1e4d9] pb-3">
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#111310] font-mono text-[11px] font-bold text-[#c7f36b]">{String(n).padStart(2,"0")}</span>
    <h4 className="text-xs font-extrabold uppercase tracking-[.035em]">{title}</h4>{refText&&<Badge tone="blue">{refText}</Badge>}</div>{children}</div>;
}
const n=(v:number,d=2)=>isFinite(v)?v.toFixed(d):"\\infty";
export default function Memoria({inp,res}:{inp:Inputs;res:Result}) {
  const [idx,setIdx]=useState(1),i=Math.min(idx,res.rows.length-1),r=res.rows[i],is19=inp.code==="318-19";
  const bar=STIRRUP_BARS[inp.stirrupBar],Vs=r.phiVs/inp.phi,VcLb=(inp.lambda*.6*res.fcSqrt+700*r.ratioUsed)*inp.bw*res.dReal;
  return <div><div className="no-print mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#cdd1c3] bg-[#e9ece1] p-3">
    <label className="text-[10px] font-extrabold uppercase tracking-[.06em]" htmlFor="sec">Sección a detallar</label>
    <select id="sec" value={i} onChange={(e)=>setIdx(parseInt(e.target.value))} className="field-control max-w-xs font-mono">{res.rows.map((q,k)=><option key={k} value={k}>x = {q.x.toFixed(2)} ft {q.isCritical?"· crítica":k===0?"· apoyo":k===res.rows.length-1?"· centro":""}</option>)}</select>
    <span className="text-[10px] text-slate-500">Pasos generales 1, 2 y 6 · pasos 3–7 para esta sección.</span></div>
    <div className="grid gap-4 xl:grid-cols-2">
      <Step n={1} title="Cargas últimas y reacción" refText={is19?"ACI 318-19 §5.3.1":"ACI 318-99 §9.2.1"}>
        <Tex>{String.raw`W_u=\gamma_D(w_{pp}+w_{losa}+w_{sup})+\gamma_Lw_{viva}=${n(inp.gD)}(${n(inp.wPP,3)}+${n(inp.wLosa,3)}+${n(inp.wSup,3)})+${n(inp.gL)}(${n(inp.wViva,3)})=${n(res.Wu,3)}\ \text{kip/ft}`}</Tex>
        <Tex>{String.raw`R_a=R_b=\dfrac{W_uL}{2}=\dfrac{${n(res.Wu,3)}(${n(inp.L,1)})}{2}=${n(res.Ra)}\ \text{kip}`}</Tex>
        <p className="text-[11px] text-slate-500">Carga muerta total = {res.Dead.toFixed(3)} kip/ft.</p></Step>
      <Step n={2} title="Peralte y propiedades" refText={is19?"ACI 318-19 §22.5.2.1":"ACI 318-99 §11.4.3"}>
        <Tex>{String.raw`d=\max(d,0.8H)=\max(${n(inp.d)},${n(.8*inp.h)})=${n(res.dReal)}\ \text{in}=${n(res.dFt,4)}\ \text{ft}`}</Tex>
        <Tex>{String.raw`\sqrt{f'_c}=${n(res.fcSqrt)}\ \text{psi}^{1/2}\qquad b_w=${n(inp.bw)}\ \text{in}`}</Tex>
        <Tex>{String.raw`A_p=${n(res.Ap,3)}\ \text{in}^2\qquad A_v=${bar?.area??0}(${inp.legs})=${n(res.Av)}\ \text{in}^2`}</Tex></Step>
      <Step n={3} title={`Fuerzas internas · x=${r.x.toFixed(2)} ft`} refText="Equilibrio">
        <Tex>{String.raw`V_u=W_u(L/2-x)=${n(res.Wu,3)}(${n(inp.L/2)}-${n(r.x)})=${n(r.V)}\ \text{kip}`}</Tex>
        <Tex>{String.raw`M_u=\dfrac{W_ux(L-x)}{2}=\dfrac{${n(res.Wu,3)}(${n(r.x)})(${n(inp.L-r.x)})}{2}=${n(r.M)}\ \text{kip·ft}`}</Tex>
        {inp.useTruck&&<Tex>{String.raw`V_{LT}=${n(r.Vt)}\ \text{kip}\quad M_{LT}=${n(r.Mt)}\ \text{kip·ft}\Rightarrow V_u=${n(r.Vu)},\ M_u=${n(r.Mu)}`}</Tex>}</Step>
      <Step n={4} title="Resistencia del concreto Vc" refText={is19?"ACI 318-19 §22.5.8.3":"ACI 318-99 §11.4.2"}>
        <Tex>{String.raw`\dfrac{V_ud}{M_u}=\dfrac{${n(r.Vu)}(${n(res.dFt,4)})}{${n(r.Mu)}}=${n(r.ratio,3)}\Rightarrow\min(1.0)=${n(r.ratioUsed,3)}`}</Tex>
        <Tex>{String.raw`V_c=(0.6\lambda\sqrt{f'_c}+700V_ud/M_u)b_wd=${n(VcLb/1000)}\ \text{kip}`}</Tex>
        <Tex>{String.raw`V_{c,min}=${n(res.VcMin)}\ \text{kip}\qquad V_{c,max}=${n(res.VcMax)}\ \text{kip}`}</Tex>
        <Tex>{String.raw`\phi V_c=${n(inp.phi)}(${n(VcLb/1000)})=${n(r.phiVcCalc)}\Rightarrow\boxed{\phi V_c=${n(r.phiVcUtil)}\ \text{kip}}`}</Tex></Step>
      <Step n={5} title="Cortante absorbido por el acero" refText="ACI §22.5.10.5">
        <Tex>{String.raw`\phi V_s=V_u-\phi V_c=${n(r.Vu)}-${n(r.phiVcUtil)}=${n(r.phiVs)}\ \text{kip}`}</Tex>
        {r.phiVs>0?<><Tex>{String.raw`V_s=\phi V_s/\phi=${n(Vs)}\ \text{kip}\le8\sqrt{f'_c}b_wd=${n(res.Vs8)}\ \text{kip}`}</Tex>
          <Tex>{String.raw`s_{teor}=\dfrac{A_vf_yd}{V_s}=\dfrac{${n(res.Av)}(${n(inp.fy,0)})(${n(res.dReal)})}{${n(Vs)}}=${n(r.sTheo)}\ \text{in}`}</Tex></>:<p className="text-xs leading-relaxed text-slate-600">φVs ≤ 0: el concreto resiste el cortante. {r.needsMin?"Como Vu > φVc/2 se requiere refuerzo mínimo.":"No se requiere refuerzo por resistencia ni mínimo."}</p>}</Step>
      <Step n={6} title="Separación máxima y mínimo" refText="ACI §9.6.3 / §9.7.6.2">
        <Tex>{String.raw`s_1=d/2=${n(res.restr.dHalf)}\ \text{in}\quad s_2=24\ \text{in}\quad s_3=0.75H=${n(res.restr.threeQuarterH)}\ \text{in}`}</Tex>
        <Tex>{String.raw`s_4=${n(res.restr.minAv50)}\ \text{in}\qquad s_5=${n(res.restr.minAvPS)}\ \text{in}`}</Tex>
        <Tex>{String.raw`s_{max}=\min(s_1,\dots,s_5)=\boxed{${n(res.restr.governing,3)}\ \text{in}}`}</Tex>
        <p className="text-[11px] text-slate-500">Rige: {res.restr.governingLabel}. {r.halved?`En esta sección se reduce a ${r.sMax.toFixed(2)} in.`:""}</p></Step>
      <Step n={7} title="Separación adoptada y verificación" refText="Resultado">
        <Tex>{String.raw`s_{req}=${n(r.sReq)}\ \text{in}\Rightarrow\boxed{s_{real}=${r.sReal>0?n(r.sReal,r.sReal%1?1:0):"\\text{—}"}\ \text{in}}`}</Tex>
        {r.sReal>0&&<Tex>{String.raw`\phi V_n=\phi V_c+\dfrac{\phi A_vf_yd}{s}=${n(r.phiVcUtil)}+\dfrac{${n(inp.phi)}(${n(res.Av)})(${n(inp.fy,0)})(${n(res.dReal)})}{${n(r.sReal)}}=${n(r.phiVnProv)}\ \text{kip}`}</Tex>}
        <Tex>{String.raw`D/C=\dfrac{V_u}{\phi V_n}=\dfrac{${n(r.Vu)}}{${n(r.phiVnProv)}}=${n(r.dc,3)}\le1.00`}</Tex>
        <Badge tone={r.status==="fail"?"red":r.status==="ok"?"green":"amber"}>{r.status==="fail"?"No cumple":r.status==="ok"?"Cumple":"Revisar mínimo"}</Badge></Step>
    </div></div>;
}
