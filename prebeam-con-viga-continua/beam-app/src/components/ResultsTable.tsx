import { CheckCircle2, CircleSlash, MinusCircle, XCircle } from "lucide-react";
import type { Inputs, Result, Row, Status } from "../lib/calc";
import { cn } from "../utils/cn";
import { Badge } from "./ui";

const f2 = (n: number) => n.toFixed(2);

export function StatusBadge({ s }: { s: Status }) {
  if (s === "ok")
    return (
      <Badge tone="green">
        <CheckCircle2 className="h-3 w-3" /> Cumple
      </Badge>
    );
  if (s === "min")
    return (
      <Badge tone="blue">
        <MinusCircle className="h-3 w-3" /> Av,mín
      </Badge>
    );
  if (s === "none")
    return (
      <Badge tone="slate">
        <CircleSlash className="h-3 w-3" /> No req.
      </Badge>
    );
  return (
    <Badge tone="red">
      <XCircle className="h-3 w-3" /> No cumple
    </Badge>
  );
}

const groups: { label: string; span: number; cls: string }[] = [
  { label: "Sección", span: 1, cls: "bg-slate-700" },
  { label: "Cortante (kip)", span: 3, cls: "bg-rose-700" },
  { label: "Momento (kip·ft)", span: 3, cls: "bg-blue-700" },
  { label: "Resistencia del concreto (kip)", span: 6, cls: "bg-amber-600" },
  { label: "Resistencia del acero (kip)", span: 1, cls: "bg-emerald-700" },
  { label: "Separación de estribos (in)", span: 4, cls: "bg-orange-600" },
  { label: "Verificación", span: 3, cls: "bg-slate-700" },
];

const heads = [
  "x (ft)",
  "V",
  "V camión",
  "Vu",
  "M",
  "M camión",
  "Mu",
  "Vu·d/Mu",
  "φVc calc.",
  "φVc útil",
  "φVc mín",
  "φVc máx",
  "φVc/2",
  "φVs",
  "S teórico",
  "S máx",
  "S req.",
  "S real",
  "φVn prov.",
  "D/C",
  "Estado",
];

export default function ResultsTable({ res }: { res: Result; inp: Inputs }) {
  return (
    <div className="card overflow-hidden">
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[1500px] border-collapse text-right text-[13px]">
          <thead>
            <tr>
              {groups.map((x) => (
                <th
                  key={x.label}
                  colSpan={x.span}
                  className={cn("border-l border-white/20 px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-white first:border-0", x.cls)}
                >
                  {x.label}
                </th>
              ))}
            </tr>
            <tr className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
              {heads.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "whitespace-nowrap border-b border-slate-300 px-2.5 py-2 font-semibold",
                    i === 0 && "sticky left-0 z-10 bg-slate-100 text-center"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {res.rows.map((r: Row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-slate-100 bg-white transition hover:bg-blue-50",
                  r.isCritical && "bg-amber-50/70",
                  r.status === "fail" && "bg-rose-50"
                )}
              >
                <td className="sticky left-0 z-10 bg-inherit px-2.5 py-1.5 text-center font-semibold text-slate-900">
                  <div className="relative bg-white/0">
                    {f2(r.x)}
                    {i === 0 && <span className="ml-1 font-sans text-[9px] font-bold text-slate-400">APOYO</span>}
                    {r.isCritical && <span className="ml-1 font-sans text-[9px] font-bold text-amber-600">CRÍT.</span>}
                    {i === res.rows.length - 1 && <span className="ml-1 font-sans text-[9px] font-bold text-slate-400">L/2</span>}
                  </div>
                </td>
                <td className="px-2.5 py-1.5">{f2(r.V)}</td>
                <td className="px-2.5 py-1.5 text-slate-400">{f2(r.Vt)}</td>
                <td className="px-2.5 py-1.5 font-semibold text-rose-700">{f2(r.Vu)}</td>
                <td className="px-2.5 py-1.5">{f2(r.M)}</td>
                <td className="px-2.5 py-1.5 text-slate-400">{f2(r.Mt)}</td>
                <td className="px-2.5 py-1.5 font-semibold text-blue-700">{f2(r.Mu)}</td>
                <td className={cn("px-2.5 py-1.5", r.ratio > 1 && "text-amber-600")}>{f2(r.ratio)}</td>
                <td className="px-2.5 py-1.5">{f2(r.phiVcCalc)}</td>
                <td className="px-2.5 py-1.5 font-semibold text-amber-700">{f2(r.phiVcUtil)}</td>
                <td className="px-2.5 py-1.5 text-slate-500">{f2(r.phiVcMin)}</td>
                <td className="px-2.5 py-1.5 text-slate-500">{f2(r.phiVcMax)}</td>
                <td className="px-2.5 py-1.5 text-slate-500">{f2(r.phiVcUtil / 2)}</td>
                <td className={cn("px-2.5 py-1.5 font-semibold", r.phiVs > 0 ? "text-emerald-700" : "text-slate-400")}>{f2(r.phiVs)}</td>
                <td className="px-2.5 py-1.5">{r.sTheo > 0 ? f2(r.sTheo) : <span className="text-slate-300">—</span>}</td>
                <td className="px-2.5 py-1.5 text-slate-500">
                  {r.sMax.toFixed(r.sMax % 1 ? 3 : 2)}
                  {r.halved && <span className="ml-0.5 text-[9px] font-bold text-amber-600">½</span>}
                </td>
                <td className="px-2.5 py-1.5">{r.sReq > 0 ? f2(r.sReq) : <span className="text-slate-300">—</span>}</td>
                <td className="px-2.5 py-1.5">
                  {r.sReal > 0 ? (
                    <span className="rounded-md bg-orange-100 px-2 py-0.5 font-bold text-orange-800">{r.sReal % 1 ? r.sReal.toFixed(1) : r.sReal.toFixed(0)}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-2.5 py-1.5">{f2(r.phiVnProv)}</td>
                <td className={cn("px-2.5 py-1.5 font-semibold", r.dc > 1.0001 ? "text-rose-600" : r.dc > 0.9 ? "text-amber-600" : "text-slate-700")}>
                  {r.dc > 0 ? r.dc.toFixed(2) : "—"}
                </td>
                <td className="px-2.5 py-1.5 text-center font-sans">
                  <StatusBadge s={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
        <span>
          <b className="text-slate-700">φVc útil</b> = φVc limitado entre 2√f'c·bw·d y 5√f'c·bw·d
        </span>
        <span>
          <b className="text-slate-700">S teórico</b> = Av·fy·d / Vs
        </span>
        <span>
          <b className="text-slate-700">S real</b> = S req. redondeado hacia abajo
        </span>
        <span>
          <b className="text-slate-700">Av,mín</b>: Vu &gt; φVc/2 y φVs ≤ 0 → rige S máx
        </span>
      </div>
    </div>
  );
}

export function RestrictionsTable({ res, inp }: { res: Result; inp: Inputs }) {
  const r = res.restr;
  const items: { label: string; formula: string; v: number }[] = [
    { label: "d / 2", formula: "d/2", v: r.dHalf },
    { label: "Distancia máxima", formula: "24 in", v: r.distance },
    { label: "0.75 · H", formula: "3H/4", v: r.threeQuarterH },
    {
      label: inp.code === "318-19" ? "Av,mín = máx(0.75√f'c, 50)·bw·s/fy" : "Av,mín = 50·bw·s/fy",
      formula: "s = Av·fy / (50·bw)",
      v: r.minAv50,
    },
    { label: "Av,mín pretensado", formula: "s = 80·Av·fy·d / (fpu·√(d/bw)·Ap)", v: r.minAvPS },
  ];
  return (
    <div className="card overflow-hidden">
      <div className="bg-sky-500 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">
        Restricciones de S máx
      </div>
      <table className="w-full text-sm">
        <tbody>
          {items.map((it) => {
            const gov = Math.abs(it.v - r.governing) < 1e-9;
            return (
              <tr key={it.label} className={cn("border-b border-slate-100", gov && "bg-amber-50")}>
                <td className="px-4 py-2">
                  <div className="font-semibold text-slate-800">{it.label}</div>
                  <div className="font-mono text-[11px] text-slate-400">{it.formula}</div>
                </td>
                <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900">
                  {isFinite(it.v) ? it.v.toFixed(2) : "—"}
                  <span className="ml-1 text-[11px] font-normal text-slate-400">in</span>
                  {gov && (
                    <div className="mt-0.5">
                      <Badge tone="amber">rige</Badge>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
