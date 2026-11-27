import type { Inputs, Result, Row, Status } from "../lib/calc";
import { Badge } from "./ui";
import { cn } from "../utils/cn";

const f2 = (n: number) => (isFinite(n) ? n.toFixed(2) : "∞");
export function StatusBadge({ s }: { s: Status }) {
  const map = { ok: ["Diseño", "green"], min: ["Mínimo", "amber"], none: ["Sin estribos", "slate"], fail: ["No cumple", "red"] } as const;
  return <Badge tone={map[s][1]}>{map[s][0]}</Badge>;
}
const headers = ["x (ft)","V","V cam.","Vu","M","M cam.","Mu","Vu·d/Mu","φVc calc","φVc útil","φVc mín","φVc máx","φVc/2","φVs","S teor.","S máx","S req.","S real","φVn prov.","D/C","Estado"];

export default function ResultsTable({ res, inp }: { res: Result; inp: Inputs }) {
  return <div className="card overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#111310] bg-[#191c16] px-4 py-3 text-white">
      <div><h3 className="text-xs font-extrabold uppercase tracking-[.06em]">Diseño por secciones</h3>
        <p className="mt-1 font-mono text-[9px] text-white/45">Semi-luz · {res.rows.length} estaciones · kip, ft, in</p></div>
      <div className="flex gap-2"><Badge tone="blue">φ = {inp.phi}</Badge><Badge tone={res.allOk ? "green" : "red"}>{res.allOk ? "Todas cumplen" : `${res.failRows} fallas`}</Badge></div>
    </div>
    <div className="scroll-thin max-h-[660px] overflow-auto">
      <table className="data-table font-mono">
        <thead><tr>{headers.map((h, i) => <th key={h} className={cn(i === 0 && "sticky left-0 z-30 bg-[#191c16] text-left", i > 0 && i < 19 && "text-right", i === 20 && "text-center")} title={h}>{h}</th>)}</tr></thead>
        <tbody>{res.rows.map((r: Row, i) => <tr key={i} className={cn(r.isCritical && "row-critical", r.status === "fail" && "row-fail")}>
          <td className="sticky left-0 z-10 border-r border-[#dfe2d7] bg-inherit text-left font-semibold">
            {f2(r.x)} <span className="font-sans text-[8px] font-bold text-slate-400">{i === 0 ? "APOYO" : r.isCritical ? "CRÍT." : i === res.rows.length - 1 ? "L/2" : ""}</span>
          </td>
          <td className="text-right">{f2(r.V)}</td><td className="text-right text-slate-400">{f2(r.Vt)}</td>
          <td className="text-right font-semibold text-[#a83215]">{f2(r.Vu)}</td>
          <td className="text-right">{f2(r.M)}</td><td className="text-right text-slate-400">{f2(r.Mt)}</td><td className="text-right font-semibold">{f2(r.Mu)}</td>
          <td className={cn("text-right", r.ratio > 1 && "text-[#9a6a00]")}>{f2(r.ratio)}</td>
          <td className="text-right">{f2(r.phiVcCalc)}</td><td className="text-right font-semibold">{f2(r.phiVcUtil)}</td>
          <td className="text-right text-slate-500">{f2(r.phiVcMin)}</td><td className="text-right text-slate-500">{f2(r.phiVcMax)}</td>
          <td className="text-right text-slate-500">{f2(r.phiVcUtil / 2)}</td>
          <td className={cn("text-right font-semibold", r.phiVs > 0 ? "text-[#34622e]" : "text-slate-400")}>{f2(r.phiVs)}</td>
          <td className="text-right">{r.sTheo > 0 ? f2(r.sTheo) : "—"}</td>
          <td className="text-right text-slate-500">{r.sMax.toFixed(r.sMax % 1 ? 3 : 2)}{r.halved ? " ½" : ""}</td>
          <td className="text-right">{r.sReq > 0 ? f2(r.sReq) : "—"}</td>
          <td className="text-right">{r.sReal > 0 ? <span className="rounded bg-[#c7f36b] px-2 py-1 font-bold text-[#111310] ring-1 ring-[#111310]">{r.sReal % 1 ? r.sReal.toFixed(1) : r.sReal.toFixed(0)}</span> : "—"}</td>
          <td className="text-right">{f2(r.phiVnProv)}</td>
          <td className={cn("text-right font-semibold", r.dc > 1.0001 ? "text-[#b52e0d]" : r.dc > .9 ? "text-[#896507]" : "")}>{r.dc > 0 ? r.dc.toFixed(2) : "—"}</td>
          <td className="text-center font-sans"><StatusBadge s={r.status} /></td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#dfe2d7] bg-[#f4f5ee] px-4 py-3 font-mono text-[9px] text-slate-500">
      <span>φVc útil ∈ [φVc mín, φVc máx]</span><span>D/C = Vu / φVn provisto</span><span>S real redondeada hacia abajo · paso {inp.rounding} in</span>
    </div>
  </div>;
}
