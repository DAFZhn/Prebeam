import type { Inputs, Result } from "../lib/calc";
import { STIRRUP_BARS, strandArea } from "../lib/calc";
import { Badge } from "./ui";
import { StatusBadge } from "./ResultsTable";

export function BeamSchematic({ inp, res }: { inp: Inputs; res: Result }) {
  const half = inp.L / 2, X0 = 70, X1 = 930, sc = (X1 - X0) / half;
  const px = (x: number) => X0 + x * sc, yTop = 105, yBot = 215;
  const maxS = Math.max(...res.zones.map((z) => z.s), 1);
  const stirrups: number[] = [];
  res.zones.forEach((z) => { if (z.s <= 0) return; for (let j = 0; j < z.count; j++) { const x = z.from + ((j + .5) * z.s) / 12; if (x < z.to + 1e-6) stirrups.push(x); } });
  return <div className="card overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dcdfd4] px-4 py-4">
      <div><h3 className="text-xs font-extrabold uppercase tracking-[.05em]">Distribución de estribos · elevación</h3>
        <p className="mt-1 text-[10px] text-slate-500">Semi-luz a escala horizontal · geometría simétrica respecto al centro.</p></div>
      <div className="flex flex-wrap gap-1.5"><Badge tone="red">{inp.stirrupBar} · {inp.legs} ramales</Badge><Badge tone="blue">{res.stirrupsHalf} / semi-luz</Badge><Badge tone="green">{res.stirrupsTotal} en la viga</Badge></div>
    </div>
    <div className="scroll-thin overflow-x-auto p-4">
      <svg viewBox="0 0 1000 325" className="w-full min-w-[760px]" role="img" aria-label="Elevación de la viga con distribución de estribos">
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#a8ad9e" /></pattern>
          <linearGradient id="concrete" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fafbf5" /><stop offset="1" stopColor="#e5e8dc" /></linearGradient></defs>
        <rect x={X0} y={yTop} width={X1-X0} height={yBot-yTop} fill="url(#concrete)" stroke="#111310" strokeWidth="2" />
        <line x1={X0} y1={yTop+18} x2={X1} y2={yTop+18} stroke="#a8ad9e" strokeDasharray="5 4" />
        <line x1={X0} y1={yBot-18} x2={X1} y2={yBot-18} stroke="#a8ad9e" strokeDasharray="5 4" />
        {res.zones.map((z, i) => { const w = (z.to-z.from)*sc, op = z.s > 0 ? .12 + .42*(1-z.s/maxS) : 0; return <g key={i}>
          <rect x={px(z.from)} y={yTop} width={w} height={yBot-yTop} fill={z.s > 0 ? "#ff6038" : "url(#hatch)"} fillOpacity={z.s > 0 ? op : .5} />
          {i > 0 && <line x1={px(z.from)} y1={yTop-38} x2={px(z.from)} y2={yBot+40} stroke="#c8cdbd" strokeDasharray="2 3" />}</g>; })}
        {stirrups.map((x,i) => <line key={i} x1={px(x)} y1={yTop+7} x2={px(x)} y2={yBot-7} stroke="#b83414" strokeWidth="1.2" />)}
        {[yBot-12,yBot-22].map((y) => <line key={y} x1={X0} y1={y} x2={X1} y2={y} stroke="#111310" strokeWidth="2.2" />)}
        <text x={X1-6} y={yBot-29} textAnchor="end" fontSize="10" fill="#111310" fontWeight="600">Ap = {strandArea(inp.strands).toFixed(2)} in² · torones</text>
        <polygon points={`${X0},${yBot} ${X0-22},${yBot+28} ${X0+22},${yBot+28}`} fill="#111310" />
        <line x1={X0-32} y1={yBot+30} x2={X0+32} y2={yBot+30} stroke="#111310" strokeWidth="3" />
        <text x={X0} y={yBot+48} textAnchor="middle" fontSize="10" fill="#51574b" fontWeight="700">APOYO</text>
        <line x1={X1} y1={yTop-40} x2={X1} y2={yBot+40} stroke="#617c25" strokeWidth="1.5" strokeDasharray="10 4 2 4" />
        <text x={X1} y={yTop-46} textAnchor="middle" fontSize="10" fill="#455c18" fontWeight="700">CL · L/2</text>
        {res.xCrit > 0 && res.xCrit < half && <g><line x1={px(res.xCrit)} y1={yTop-4} x2={px(res.xCrit)} y2={yBot+4} stroke="#e9b919" strokeWidth="2" />
          <text x={px(res.xCrit)} y={yBot+62} textAnchor="middle" fontSize="10" fill="#765b08" fontWeight="700">SECCIÓN CRÍTICA</text></g>}
        {res.zones.map((z,i) => { const w=(z.to-z.from)*sc,cx=px(z.from)+w/2; return <g key={i}>
          <line x1={px(z.from)+1} y1={yTop-22} x2={px(z.to)-1} y2={yTop-22} stroke="#111310" />
          <line x1={px(z.from)+1} y1={yTop-26} x2={px(z.from)+1} y2={yTop-18} stroke="#111310" />
          <line x1={px(z.to)-1} y1={yTop-26} x2={px(z.to)-1} y2={yTop-18} stroke="#111310" />
          {w>=34 && <text x={cx} y={yTop-28} textAnchor="middle" fontSize="11" fontWeight="700" fill={z.s>0?"#a83215":"#68705f"}>{z.s>0?`@${z.s%1?z.s.toFixed(1):z.s}″`:"s/e"}</text>}</g>; })}
        <line x1={X0} y1={yBot+82} x2={X1} y2={yBot+82} stroke="#68705f" />
        {[0,...res.zones.map((z)=>z.to)].map((x,i,arr) => { const prev=i>0?px(arr[i-1]):-100,show=px(x)-prev>=28||i===arr.length-1||i===0; return <g key={i}>
          <line x1={px(x)} y1={yBot+78} x2={px(x)} y2={yBot+86} stroke="#68705f" />
          {show && <text x={px(x)} y={yBot+98} textAnchor="middle" fontSize="10" fill="#51574b" fontFamily="IBM Plex Mono, monospace">{x.toFixed(2)}</text>}</g>; })}
        <text x={X1+8} y={yBot+86} fontSize="10" fill="#68705f">ft</text>
      </svg>
    </div>
  </div>;
}

export function ZonesSummary({ inp, res }: { inp: Inputs; res: Result }) {
  const bar = STIRRUP_BARS[inp.stirrupBar]; const dia = bar ? bar.label.split(" ")[0] : inp.stirrupBar;
  return <div className="card overflow-hidden">
    <div className="flex items-center justify-between border-b border-[#dcdfd4] px-4 py-3"><h3 className="text-xs font-extrabold uppercase tracking-[.05em]">Resumen de armado transversal</h3><span className="font-mono text-[9px] text-slate-400">APOYO → L/2</span></div>
    <div className="scroll-thin max-h-[330px] overflow-auto"><table className="data-table"><thead><tr><th>Zona</th><th>Desde–hasta (ft)</th><th>Long.</th><th>Armado</th><th>N°</th><th>Estado</th></tr></thead>
      <tbody>{res.zones.map((z,i) => <tr key={i} className={z.status === "fail" ? "row-fail" : ""}><td className="font-semibold">Z{i+1}</td>
        <td className="font-mono">{z.from.toFixed(2)} – {z.to.toFixed(2)}</td><td className="font-mono">{(z.to-z.from).toFixed(2)}</td>
        <td className="font-semibold">{z.s>0?`${dia} @ ${z.s%1?z.s.toFixed(1):z.s}″`:"Sin estribos"}</td><td className="font-mono">{z.count}</td><td><StatusBadge s={z.status} /></td></tr>)}</tbody></table></div>
  </div>;
}
