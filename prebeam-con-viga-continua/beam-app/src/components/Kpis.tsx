import { Activity, ArrowDownToLine, Cable, Layers, Ruler, ShieldCheck, ShieldAlert, Sigma } from "lucide-react";
import type { ReactNode } from "react";
import type { Inputs, Result } from "../lib/calc";
import { cn } from "../utils/cn";

export function Kpi({
  icon,
  label,
  value,
  unit,
  sub,
  tone = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  sub?: string;
  tone?: "blue" | "amber" | "green" | "red" | "violet" | "slate";
}) {
  const t = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
    slate: "bg-slate-100 text-slate-600",
  }[tone];
  return (
    <div className="card flex items-start gap-3 p-3.5">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", t)}>{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="font-mono text-xl font-semibold text-slate-900">{value}</span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
        {sub && <div className="mt-0.5 truncate text-[11px] text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

export default function Kpis({ inp, res }: { inp: Inputs; res: Result }) {
  const vuMax = res.rows[0].Vu;
  const vuCrit = res.rows.find((r) => r.isCritical)?.Vu ?? vuMax;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
      <Kpi icon={<Sigma className="h-4.5 w-4.5" />} label="Carga última Wu" value={res.Wu.toFixed(3)} unit="kip/ft" sub={`${inp.gD}·D + ${inp.gL}·L`} tone="amber" />
      <Kpi icon={<ArrowDownToLine className="h-4.5 w-4.5" />} label="Reacción Ra = Rb" value={res.Ra.toFixed(2)} unit="kip" sub={`Vu crítico ${vuCrit.toFixed(2)} kip`} tone="red" />
      <Kpi icon={<Ruler className="h-4.5 w-4.5" />} label="d real" value={res.dReal.toFixed(2)} unit="in" sub={`${res.dFt.toFixed(3)} ft`} tone="slate" />
      <Kpi icon={<Cable className="h-4.5 w-4.5" />} label="Ap torones" value={res.Ap.toFixed(3)} unit="in²" tone="blue" />
      <Kpi icon={<Layers className="h-4.5 w-4.5" />} label="Av estribos" value={res.Av.toFixed(2)} unit="in²" sub={`${inp.stirrupBar} × ${inp.legs} ramales`} tone="violet" />
      <Kpi icon={<Activity className="h-4.5 w-4.5" />} label="φVc mín – máx" value={`${(inp.phi * res.VcMin).toFixed(1)}–${(inp.phi * res.VcMax).toFixed(1)}`} unit="kip" sub="2√f'c – 5√f'c · bw·d" tone="green" />
      <Kpi icon={<Ruler className="h-4.5 w-4.5" />} label="S máx rige" value={res.restr.governing.toFixed(2)} unit="in" sub={res.restr.governingLabel} tone="amber" />
      <Kpi
        icon={res.allOk ? <ShieldCheck className="h-4.5 w-4.5" /> : <ShieldAlert className="h-4.5 w-4.5" />}
        label="Estado del diseño"
        value={res.allOk ? "CUMPLE" : "NO CUMPLE"}
        unit=""
        sub={res.allOk ? `${res.stirrupsTotal} estribos / viga` : `${res.failRows} sección(es) falla`}
        tone={res.allOk ? "green" : "red"}
      />
    </div>
  );
}
