import { Area, CartesianGrid, ComposedChart, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ContinuousResult } from "./engine";
import { f2, nodeName } from "./format";

const axis={fontSize:10,fill:"#68705f",fontFamily:"IBM Plex Mono"};
const tip=(v:unknown)=>typeof v==="number"?f2(v):String(v);
function Frame({title,desc,children}:{title:string;desc:string;children:React.ReactNode}) {
  return <div className="card overflow-hidden"><div className="border-b border-[#dfe2d7] px-4 py-3"><h3 className="text-xs font-extrabold uppercase tracking-[.04em]">{title}</h3><p className="mt-1 text-[10px] text-slate-500">{desc}</p></div><div className="h-[390px] p-2">{children}</div></div>;
}
export default function ContinuousCharts({res}:{res:ContinuousResult}) {
  const data=res.dense,common={data,margin:{top:12,right:18,left:6,bottom:5}};
  const x=<XAxis dataKey="X" type="number" domain={[0,res.total]} tick={axis} tickFormatter={(v)=>f2(Number(v),0)} label={{value:"Coordenada global X (ft)",position:"insideBottom",offset:-4,style:axis}} height={45}/>;
  const supports=res.nodes.map((nd)=><ReferenceLine key={nd.index} x={nd.X} stroke={nd.kind==="libre"?"#b7bcae":"#7d8374"} strokeDasharray="3 4" label={{value:nodeName(nd.index),position:"top",fontSize:9,fill:"#51574b"}}/>);
  const tooltip=<Tooltip formatter={tip} labelFormatter={(l)=>`X = ${f2(Number(l))} ft`} contentStyle={{border:"1px solid #111310",borderRadius:8,background:"#fffffc",fontSize:11,boxShadow:"4px 4px 0 #c7f36b"}}/>;
  return <div className="space-y-4">
    <Frame title="Envolvente de cortante Vu" desc="Valores máximo y mínimo factorizados. La alternancia de carga viva se evalúa tramo por tramo."><ResponsiveContainer><ComposedChart {...common}>
      <CartesianGrid stroke="#dfe2d7" strokeDasharray="3 3"/>{x}<YAxis tick={axis} label={{value:"Vu (kip)",angle:-90,position:"insideLeft",style:axis}}/>{tooltip}{supports}<ReferenceLine y={0} stroke="#111310"/><Legend verticalAlign="top" height={30} wrapperStyle={{fontSize:11}}/>
      <Area type="linear" dataKey="Vpos" name="Vu máximo" stroke="#718e31" fill="#c7f36b" fillOpacity={.18} strokeWidth={2.2} isAnimationActive={false}/>
      <Area type="linear" dataKey="Vneg" name="Vu mínimo" stroke="#ff6038" fill="#ff6038" fillOpacity={.08} strokeWidth={2.2} isAnimationActive={false}/>
    </ComposedChart></ResponsiveContainer></Frame>
    <Frame title="Envolvente de momento Mu" desc="Convención: momento positivo con tracción inferior; momento negativo en apoyos con tracción superior."><ResponsiveContainer><ComposedChart {...common}>
      <CartesianGrid stroke="#dfe2d7" strokeDasharray="3 3"/>{x}<YAxis tick={axis} label={{value:"Mu (kip·ft)",angle:-90,position:"insideLeft",style:axis}}/>{tooltip}{supports}<ReferenceLine y={0} stroke="#111310"/><Legend verticalAlign="top" height={30} wrapperStyle={{fontSize:11}}/>
      <Area type="monotone" dataKey="Mpos" name="Mu máximo" stroke="#718e31" fill="#c7f36b" fillOpacity={.2} strokeWidth={2.2} isAnimationActive={false}/>
      <Area type="monotone" dataKey="Mneg" name="Mu mínimo" stroke="#766593" fill="#766593" fillOpacity={.1} strokeWidth={2.2} isAnimationActive={false}/>
    </ComposedChart></ResponsiveContainer></Frame>
  </div>;
}
