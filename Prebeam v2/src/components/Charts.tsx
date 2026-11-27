import { useMemo, type ReactNode } from "react";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { denseCurve, type Inputs, type Result } from "../lib/calc";

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <div className="card overflow-hidden"><div className="border-b border-[#e0e3d8] px-4 py-3"><h3 className="text-xs font-extrabold uppercase tracking-[.04em]">{title}</h3>{subtitle && <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{subtitle}</p>}</div><div className="h-[340px] w-full p-2">{children}</div></div>;
}
const axisStyle = { fontSize: 10, fill: "#68705f", fontFamily: "IBM Plex Mono" };
const tipFmt = (v: unknown) => typeof v === "number" ? v.toFixed(2) : String(v);
export default function Charts({ inp, res }: { inp: Inputs; res: Result }) {
  const data = useMemo(() => {
    const dense = denseCurve(inp,res,120), st = new Set(res.rows.map((r)=>Math.round(r.x*1e4)/1e4));
    return dense.map((r) => { const isSt=st.has(Math.round(r.x*1e4)/1e4),stRow=isSt?res.rows.find((q)=>Math.abs(q.x-r.x)<1e-3):undefined;
      return { x:Math.round(r.x*1000)/1000,Vu:r.Vu,phiVc:r.phiVcUtil,phiVcMin:r.phiVcMin,phiVcMax:r.phiVcMax,Mu:r.Mu,sTheo:r.sTheo>0?r.sTheo:null,sMax:r.sMax,VuSt:isSt?r.Vu:null,sReal:stRow&&stRow.sReal>0?stRow.sReal:stRow?null:undefined }; });
  },[inp,res]);
  const half=inp.L/2;
  const ticks=useMemo(()=>{ const step=half<=20?2:half<=40?5:10,t:number[]=[]; for(let v=0;v<=half+1e-6;v+=step)t.push(v); if(Math.abs(t[t.length-1]-half)>1e-6)t.push(half); return t; },[half]);
  const xAxis=<XAxis dataKey="x" type="number" domain={[0,half]} ticks={ticks} tickFormatter={(v)=>Number.isInteger(v)?String(v):v.toFixed(1)} tick={axisStyle} label={{value:"Distancia desde el apoyo (ft)",position:"insideBottom",offset:-4,style:{...axisStyle,fontWeight:600}}} height={44}/>;
  const common={data,margin:{top:10,right:16,left:4,bottom:4}};
  const tooltip=<Tooltip formatter={tipFmt} labelFormatter={(l)=>`x = ${Number(l).toFixed(2)} ft`} contentStyle={{borderRadius:8,border:"1px solid #111310",background:"#fffffc",fontSize:11,boxShadow:"4px 4px 0 #c7f36b"}}/>;
  const crit=res.xCrit>0&&res.xCrit<half&&<ReferenceLine x={res.xCrit} stroke="#d3a509" strokeDasharray="4 3" label={{value:"CRÍT.",position:"top",fill:"#765b08",fontSize:9}}/>;
  return <div className="grid gap-4 xl:grid-cols-2">
    <div className="xl:col-span-2"><ChartCard title="Cortante · demanda Vu vs. resistencia φVc" subtitle="Donde Vu supera φVc se requiere refuerzo. Los puntos identifican las secciones de diseño."><ResponsiveContainer><ComposedChart {...common}>
      <CartesianGrid stroke="#dfe2d7" strokeDasharray="3 3"/>{xAxis}<YAxis tick={axisStyle} label={{value:"V (kip)",angle:-90,position:"insideLeft",style:axisStyle}}/>{tooltip}<Legend verticalAlign="top" height={30} wrapperStyle={{fontSize:11}}/>
      <Area type="monotone" dataKey="Vu" name="Vu" stroke="none" fill="#a5cd52" fillOpacity={.14} isAnimationActive={false} legendType="none"/>
      <Line type="linear" dataKey="Vu" name="Vu · demanda" stroke="#718e31" strokeWidth={2.5} dot={false} isAnimationActive={false}/>
      <Line type="monotone" dataKey="phiVc" name="φVc útil" stroke="#ff6038" strokeWidth={2.5} dot={false} isAnimationActive={false}/>
      <Line type="linear" dataKey="phiVcMin" name="φVc mín" stroke="#4c8050" strokeWidth={1.6} strokeDasharray="6 4" dot={false} isAnimationActive={false}/>
      <Line type="linear" dataKey="phiVcMax" name="φVc máx" stroke="#766593" strokeWidth={1.6} strokeDasharray="6 4" dot={false} isAnimationActive={false}/>
      <Line type="linear" dataKey="VuSt" name="Secciones" stroke="none" dot={{r:4,fill:"#111310",stroke:"#c7f36b",strokeWidth:1.5}} activeDot={false} isAnimationActive={false}/>{crit}
    </ComposedChart></ResponsiveContainer></ChartCard></div>
    <ChartCard title="Momento último Mu" subtitle="Mu = Wu·x·(L−x)/2 + camión si está activo."><ResponsiveContainer><ComposedChart {...common}>
      <CartesianGrid stroke="#dfe2d7" strokeDasharray="3 3"/>{xAxis}<YAxis tick={axisStyle} label={{value:"Mu (kip·ft)",angle:-90,position:"insideLeft",style:axisStyle}}/>{tooltip}
      <Area type="monotone" dataKey="Mu" name="Mu" stroke="#718e31" strokeWidth={2.5} fill="#c7f36b" fillOpacity={.24} isAnimationActive={false}/>{crit}
    </ComposedChart></ResponsiveContainer></ChartCard>
    <ChartCard title="Separación de estribos" subtitle="S teórico limitado por S máx; la escalera lima representa S real colocada."><ResponsiveContainer><ComposedChart {...common}>
      <CartesianGrid stroke="#dfe2d7" strokeDasharray="3 3"/>{xAxis}<YAxis tick={axisStyle} domain={[0,Math.ceil((res.restr.governing*1.4)/5)*5]} allowDataOverflow label={{value:"s (in)",angle:-90,position:"insideLeft",style:axisStyle}}/>{tooltip}<Legend verticalAlign="top" height={30} wrapperStyle={{fontSize:11}}/>
      <Line type="monotone" dataKey="sTheo" name="S teórico" stroke="#718e31" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false}/>
      <Line type="linear" dataKey="sMax" name="S máx" stroke="#ff6038" strokeWidth={1.8} strokeDasharray="6 4" dot={false} isAnimationActive={false}/>
      <Line type="stepAfter" dataKey="sReal" name="S real" stroke="#111310" strokeWidth={2.5} dot={{r:3.5,fill:"#c7f36b",stroke:"#111310",strokeWidth:1}} connectNulls isAnimationActive={false}/>{crit}
    </ComposedChart></ResponsiveContainer></ChartCard>
  </div>;
}
