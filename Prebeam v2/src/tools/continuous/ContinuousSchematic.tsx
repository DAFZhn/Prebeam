import type { ContinuousInputs, ContinuousResult } from "./engine";
import { f2, nodeName } from "./format";
import { Badge } from "../../components/ui";

export default function ContinuousSchematic({inp,res}:{inp:ContinuousInputs;res:ContinuousResult}) {
  const X0=75,X1=1125,W=X1-X0,px=(X:number)=>X0+(X/res.total)*W,y=165;
  return <div className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe2d7] px-4 py-4">
    <div><h3 className="text-xs font-extrabold uppercase tracking-[.05em]">Modelo estructural</h3><p className="mt-1 text-[10px] text-slate-500">Geometría global, condiciones de extremo, cargas y reacciones últimas máximas.</p></div>
    <div className="flex gap-2"><Badge tone="blue">{inp.spans.length} tramos</Badge><Badge tone={inp.pattern?"green":"slate"}>{inp.pattern?"Carga viva alternada":"Carga viva uniforme"}</Badge></div></div>
    <div className="scroll-thin overflow-x-auto p-4"><svg viewBox="0 0 1200 340" className="w-full min-w-[900px]" role="img" aria-label="Esquema de la viga continua">
      <defs><marker id="arrow-load" viewBox="0 0 10 10" refX="5" refY="8" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 5 10 10 0" fill="#ff6038"/></marker></defs>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#111310" strokeWidth="15"/>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#c7f36b" strokeWidth="3" strokeDasharray="18 10"/>
      {inp.spans.map((s,i)=>{const a=px(res.spanStart[i]),b=px(res.spanStart[i]+s.L),mid=(a+b)/2;return <g key={i}>
        <rect x={a} y={y-7.5} width={b-a} height={15} fill={i%2?"#ff6038":"#c7f36b"} opacity={.22}/>
        <text x={mid} y={y-54} textAnchor="middle" fontSize="12" fontWeight="800" fill="#111310">TRAMO {i+1} · L={f2(s.L,1)} ft</text>
        <text x={mid} y={y-37} textAnchor="middle" fontSize="10" fill="#59604f" fontFamily="IBM Plex Mono">EI={f2(s.EIrel,2)} · wD={f2(s.wD,3)} · wL={f2(s.wL,3)} kip/ft</text>
        <line x1={a+5} y1={y+66} x2={b-5} y2={y+66} stroke="#7a8170"/><line x1={a+5} y1={y+61} x2={a+5} y2={y+71} stroke="#7a8170"/><line x1={b-5} y1={y+61} x2={b-5} y2={y+71} stroke="#7a8170"/>
      </g>;})}
      {res.nodes.map((nd)=>{const x=px(nd.X),kind=nd.kind;return <g key={nd.index}>
        {kind==="apoyo"&&<><polygon points={`${x},${y+8} ${x-19},${y+40} ${x+19},${y+40}`} fill="#111310"/><line x1={x-28} y1={y+44} x2={x+28} y2={y+44} stroke="#111310" strokeWidth="3"/></>}
        {kind==="empotramiento"&&<><rect x={x-7} y={y-36} width={14} height={80} fill="#111310"/>{[-28,-12,4,20,36].map((d)=><line key={d} x1={x-7} y1={y+d} x2={x-24} y2={y+d+15} stroke="#111310"/>)}</>}
        {kind==="libre"&&<circle cx={x} cy={y} r={7} fill="#f1f1e9" stroke="#111310" strokeWidth="2"/>}
        <circle cx={x} cy={y-89} r={14} fill="#111310"/><text x={x} y={y-85} textAnchor="middle" fontSize="11" fontWeight="700" fill="#c7f36b">{nodeName(nd.index)}</text>
        <text x={x} y={y+91} textAnchor="middle" fontSize="9" fontWeight="700" fill="#51574b">{kind.toUpperCase()}</text>
        {kind!=="libre"&&<text x={x} y={y+108} textAnchor="middle" fontSize="10" fill="#455c18" fontFamily="IBM Plex Mono">Ru máx {f2(nd.Rmax)} kip</text>}
      </g>;})}
      {inp.points.map((p,i)=>{const X=res.spanStart[p.span]+p.a,x=px(X);return <g key={i}><line x1={x} y1={y-135} x2={x} y2={y-18} stroke="#ff6038" strokeWidth="2.5" markerEnd="url(#arrow-load)"/>
        <text x={x+6} y={y-126} fontSize="10" fontWeight="700" fill="#a83215">P{i+1} · {f2(p.P)} kip ({p.kind})</text></g>;})}
      <text x={X1} y={285} textAnchor="end" fontSize="10" fill="#68705f" fontFamily="IBM Plex Mono">Longitud total = {f2(res.total)} ft</text>
    </svg></div>
  </div>;
}
