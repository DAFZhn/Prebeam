import { Activity, ArrowDownToLine, Cable, Layers, Ruler, ShieldCheck, ShieldAlert, Sigma } from "lucide-react";
import type { ReactNode } from "react";
import type { Inputs, Result } from "../lib/calc";
import { cn } from "../utils/cn";

export function Kpi({ icon, label, value, unit, sub, tone = "blue" }: {
  icon: ReactNode; label: string; value: string; unit: string; sub?: string;
  tone?: "blue" | "amber" | "green" | "red" | "violet" | "slate";
}) {
  const t = {
    blue: "bg-[#eaf3ce] text-[#4b6418]", amber: "bg-[#fff3c9] text-[#896507]",
    green: "bg-[#e2f0db] text-[#34622e]", red: "bg-[#ffebe4] text-[#b63a17]",
    violet: "bg-[#ece8f5] text-[#5c4e82]", slate: "bg-[#e9ebe3] text-[#50564b]",
  }[tone];
  return <div className="card group relative overflow-hidden p-4 hover:-translate-y-0.5 hover:border-[#111310]">
    <div className="flex items-start justify-between gap-2">
      <div className="truncate text-[9px] font-extrabold uppercase tracking-[.09em] text-slate-500">{label}</div>
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", t)}>{icon}</div>
    </div>
    <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
      <span className="font-mono text-[clamp(17px,1.35vw,23px)] font-semibold leading-none tracking-[-.06em] text-[#111310]">{value}</span>
      <span className="font-mono text-[9px] text-slate-500">{unit}</span>
    </div>
    {sub && <div className="mt-2 truncate border-t border-[#e4e6dd] pt-2 text-[9px] text-slate-400" title={sub}>{sub}</div>}
    <span className={cn("absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full", tone === "red" ? "bg-[#ff6038]" : "bg-[#a5cd52]")} />
  </div>;
}

export default function Kpis({ inp, res }: { inp: Inputs; res: Result }) {
  const vuMax = res.rows[0].Vu;
  const vuCrit = res.rows.find((r) => r.isCritical)?.Vu ?? vuMax;
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
    <Kpi icon={<Sigma className="h-4 w-4" />} label="Carga última Wu" value={res.Wu.toFixed(3)} unit="kip/ft" sub={`${inp.gD}·D + ${inp.gL}·L`} tone="amber" />
    <Kpi icon={<ArrowDownToLine className="h-4 w-4" />} label="Reacción Ra = Rb" value={res.Ra.toFixed(2)} unit="kip" sub={`Vu crítico ${vuCrit.toFixed(2)} kip`} tone="red" />
    <Kpi icon={<Ruler className="h-4 w-4" />} label="d real" value={res.dReal.toFixed(2)} unit="in" sub={`${res.dFt.toFixed(3)} ft`} tone="slate" />
    <Kpi icon={<Cable className="h-4 w-4" />} label="Ap torones" value={res.Ap.toFixed(3)} unit="in²" tone="blue" />
    <Kpi icon={<Layers className="h-4 w-4" />} label="Av estribos" value={res.Av.toFixed(2)} unit="in²" sub={`${inp.stirrupBar} × ${inp.legs} ramales`} tone="violet" />
    <Kpi icon={<Activity className="h-4 w-4" />} label="φVc mín – máx" value={`${(inp.phi * res.VcMin).toFixed(1)}–${(inp.phi * res.VcMax).toFixed(1)}`} unit="kip" sub="2√f'c – 5√f'c · bw·d" tone="green" />
    <Kpi icon={<Ruler className="h-4 w-4" />} label="S máx rige" value={res.restr.governing.toFixed(2)} unit="in" sub={res.restr.governingLabel} tone="amber" />
    <Kpi icon={res.allOk ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />} label="Estado del diseño" value={res.allOk ? "CUMPLE" : "NO CUMPLE"} unit="" sub={res.allOk ? `${res.stirrupsTotal} estribos / viga` : `${res.failRows} sección(es) falla`} tone={res.allOk ? "green" : "red"} />
  </div>;
}
