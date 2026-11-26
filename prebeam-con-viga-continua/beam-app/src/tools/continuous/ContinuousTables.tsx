import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "../../components/ui";
import { StatusBadge } from "../../components/ResultsTable";
import { cn } from "../../utils/cn";
import type { ContinuousInputs, ContinuousResult, FlexStatus } from "./engine";
import { f2, nodeName } from "./format";

function FlexBadge({ s }: { s: FlexStatus }) {
  if (s === "ok")
    return (
      <Badge tone="green">
        <CheckCircle2 className="h-3 w-3" /> Cumple
      </Badge>
    );
  if (s === "fail")
    return (
      <Badge tone="red">
        <XCircle className="h-3 w-3" /> No cumple
      </Badge>
    );
  return <span className="text-slate-300">—</span>;
}

const groups: { label: string; span: number; cls: string }[] = [
  { label: "Sección", span: 3, cls: "bg-slate-700" },
  { label: "Cortante de diseño", span: 3, cls: "bg-rose-700" },
  { label: "Resistencia (kip)", span: 2, cls: "bg-amber-600" },
  { label: "Separación de estribos (in)", span: 3, cls: "bg-orange-600" },
  { label: "Verificación cortante", span: 2, cls: "bg-slate-700" },
  { label: "Flexión (kip·ft)", span: 5, cls: "bg-blue-700" },
];
const heads = ["Tramo", "x (ft)", "X (ft)", "Vu (kip)", "Mu conc.", "Vu·d/Mu", "φVc útil", "φVs", "S teór.", "S máx", "S real", "D/C", "Estado", "Mu+", "Mu−", "D/C +", "D/C −", "Estado"];

const dcCls = (v: number) => (v > 1.0001 ? "text-rose-600" : v > 0.9 ? "text-amber-600" : "text-slate-700");

/** Tabla de diseño: cortante y flexión en cada sección de cada tramo */
export function StationsTable({ res }: { res: ContinuousResult; inp: ContinuousInputs }) {
  return (
    <div className="card overflow-hidden">
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[1500px] border-collapse text-right text-[13px]">
          <thead>
            <tr>
              {groups.map((g) => (
                <th key={g.label} colSpan={g.span} className={cn("border-l border-white/20 px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-white first:border-0", g.cls)}>
                  {g.label}
                </th>
              ))}
            </tr>
            <tr className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
              {heads.map((h, i) => (
                <th key={i} className={cn("whitespace-nowrap border-b border-slate-300 px-2.5 py-2 font-semibold", i === 0 && "text-center")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {res.rows.map((r, i) => {
              const s = r.shear;
              const first = i === 0 || res.rows[i - 1].span !== r.span;
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-slate-100 bg-white transition hover:bg-blue-50",
                    first && i > 0 && "border-t-2 border-t-slate-300",
                    r.isCritical && "bg-amber-50/70",
                    (s.status === "fail" || r.flexStatus === "fail") && "bg-rose-50"
                  )}
                >
                  <td className="px-2.5 py-1.5 text-center font-sans font-bold text-slate-700">{first ? r.span + 1 : ""}</td>
                  <td className="px-2.5 py-1.5 font-semibold text-slate-900">
                    {f2(r.x)}
                    {r.isSupport && <span className="ml-1 font-sans text-[9px] font-bold text-slate-400">APOYO</span>}
                    {r.isCritical && <span className="ml-1 font-sans text-[9px] font-bold text-amber-600">CRÍT.</span>}
                    {r.isLoad && <span className="ml-1 font-sans text-[9px] font-bold text-rose-500">CARGA</span>}
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-500">{f2(r.X)}</td>
                  <td className="px-2.5 py-1.5 font-semibold text-rose-700" title={r.clamped ? `Cortante tomado en la sección crítica (x = ${f2(r.xEval)} ft)` : undefined}>
                    {f2(Math.abs(r.Vu))}
                    {r.clamped && <span className="ml-0.5 font-sans text-[10px] text-amber-600">†</span>}
                  </td>
                  <td className="px-2.5 py-1.5 text-blue-700">{f2(r.Mc)}</td>
                  <td className={cn("px-2.5 py-1.5", s.ratio > 1 && "text-amber-600")}>{f2(s.ratio)}</td>
                  <td className="px-2.5 py-1.5 font-semibold text-amber-700">{f2(s.phiVcUtil)}</td>
                  <td className={cn("px-2.5 py-1.5 font-semibold", s.phiVs > 0 ? "text-emerald-700" : "text-slate-400")}>{f2(s.phiVs)}</td>
                  <td className="px-2.5 py-1.5">{s.sTheo > 0 ? f2(s.sTheo) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-2.5 py-1.5 text-slate-500">
                    {f2(s.sMax, s.sMax % 1 ? 3 : 2)}
                    {s.halved && <span className="ml-0.5 text-[9px] font-bold text-amber-600">½</span>}
                  </td>
                  <td className="px-2.5 py-1.5">
                    {s.sReal > 0 ? <span className="rounded-md bg-orange-100 px-2 py-0.5 font-bold text-orange-800">{s.sReal % 1 ? s.sReal.toFixed(1) : s.sReal.toFixed(0)}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className={cn("px-2.5 py-1.5 font-semibold", dcCls(s.dc))}>{s.dc > 0 ? f2(s.dc) : "—"}</td>
                  <td className="px-2.5 py-1.5 text-center font-sans">
                    <StatusBadge s={s.status} />
                  </td>
                  <td className="px-2.5 py-1.5 font-semibold text-sky-700">{r.MuPos > 0 ? f2(r.MuPos) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-2.5 py-1.5 font-semibold text-violet-700">{r.MuNeg < -1e-3 ? f2(r.MuNeg) : <span className="text-slate-300">—</span>}</td>
                  <td className={cn("px-2.5 py-1.5 font-semibold", dcCls(r.dcPos))}>{r.dcPos > 0 ? f2(r.dcPos) : "—"}</td>
                  <td className={cn("px-2.5 py-1.5 font-semibold", dcCls(r.dcNeg))}>{r.dcNeg > 0 ? f2(r.dcNeg) : "—"}</td>
                  <td className="px-2.5 py-1.5 text-center font-sans">
                    <FlexBadge s={r.flexStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
        <span>
          <b className="text-slate-700">Vu</b>: cortante máximo en valor absoluto de la envolvente · <b className="text-slate-700">Mu conc.</b>: |Mu| que actúa con ese cortante
        </span>
        <span>
          <b className="text-slate-700">†</b> entre el eje del apoyo y la sección crítica se diseña con el Vu de la sección crítica
        </span>
        <span>
          <b className="text-slate-700">Mu+ / Mu−</b>: envolvente de flexión en la sección
        </span>
      </div>
    </div>
  );
}

const kindLabel = { apoyo: "Apoyo", empotramiento: "Empotramiento", libre: "Extremo libre" } as const;

/** Reacciones, momentos en los nodos y acero superior requerido */
export function NodesTable({ res, inp }: { res: ContinuousResult; inp: ContinuousInputs }) {
  const heads = ["Nodo", "X (ft)", "Tipo", "R muerta", "R viva (total)", "Ru máx", "Ru mín", "Mu− nodo", "Mu+ nodo", "As req.", "As prov.", "As req./prov."];
  return (
    <div className="card overflow-hidden">
      <div className="bg-sky-500 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Reacciones y momentos en los nodos</div>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-right text-[13px]">
          <thead>
            <tr className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
              {heads.map((h, i) => (
                <th key={h} className={cn("whitespace-nowrap border-b border-slate-300 px-2.5 py-2 font-semibold", i < 3 && "text-left")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {res.nodes.map((nd) => {
              const free = nd.kind === "libre";
              return (
                <tr key={nd.index} className="border-b border-slate-100 bg-white transition hover:bg-blue-50">
                  <td className="px-2.5 py-1.5 text-left font-sans text-base font-extrabold text-slate-900">{nodeName(nd.index)}</td>
                  <td className="px-2.5 py-1.5 text-left">{f2(nd.X)}</td>
                  <td className="px-2.5 py-1.5 text-left font-sans text-slate-600">{kindLabel[nd.kind]}</td>
                  <td className="px-2.5 py-1.5">{free ? "—" : f2(nd.RD)}</td>
                  <td className="px-2.5 py-1.5">{free ? "—" : f2(nd.RL)}</td>
                  <td className="px-2.5 py-1.5 font-semibold text-rose-700">{free ? "—" : f2(nd.Rmax)}</td>
                  <td className={cn("px-2.5 py-1.5", nd.Rmin < -1e-6 && !free ? "font-semibold text-rose-600" : "text-slate-700")}>{free ? "—" : f2(nd.Rmin)}</td>
                  <td className="px-2.5 py-1.5 font-semibold text-violet-700">{free ? "—" : f2(nd.Mmin)}</td>
                  <td className="px-2.5 py-1.5 text-sky-700">{free ? "—" : f2(nd.Mmax)}</td>
                  <td className="px-2.5 py-1.5">{nd.asReq === null ? (nd.asDc === null ? "—" : "sección insuf.") : nd.asDc === null ? "—" : f2(nd.asReq)}</td>
                  <td className="px-2.5 py-1.5">{nd.asDc === null ? "—" : f2(inp.asTop)}</td>
                  <td className={cn("px-2.5 py-1.5 font-semibold", nd.asDc === null ? "text-slate-300" : dcCls(nd.asDc))}>{nd.asDc === null ? "—" : f2(nd.asDc)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
        Reacciones en kip, momentos en kip·ft. Ru = 1.2·D + 1.6·L (con los factores elegidos). <b className="text-slate-700">As req.</b> es el acero superior ordinario que pide el momento negativo del nodo (φ = {inp.phiF}); se compara con el As superior provisto.
      </div>
    </div>
  );
}

/** Capacidades a flexión calculadas */
export function FlexCapacityCard({ res, inp }: { res: ContinuousResult; inp: ContinuousInputs }) {
  const f = res.flex;
  const rows: { k: string; v: string; sub?: string }[] = [
    { k: "β1", v: f2(f.beta1, 2) },
    { k: "fps (torones, aprox. ACI 20.3.2.3.1)", v: `${f2(f.fps, 1)} ksi`, sub: `fpu = ${inp.fpu} ksi` },
    { k: "Positivo · a / εt / φ", v: `${f2(f.aPos)} in / ${f2(f.epsPos, 4)} / ${f2(f.phiPos)}`, sub: f.aPos > inp.hf ? "a > hf (aprox.)" : "a ≤ hf" },
    { k: "Positivo · φMn+", v: `${f2(f.phiMnPos, 1)} kip·ft` },
    { k: "Negativo · a / εt / φ", v: `${f2(f.aNeg)} in / ${f2(f.epsNeg, 4)} / ${f2(f.phiNeg)}` },
    { k: "Negativo · φMn−", v: `${f2(f.phiMnNeg, 1)} kip·ft` },
  ];
  return (
    <div className="card overflow-hidden">
      <div className="bg-emerald-600 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Capacidad a flexión</div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.k} className="border-b border-slate-100">
              <td className="px-4 py-2 text-slate-700">
                {r.k}
                {r.sub && <div className="font-mono text-[11px] text-slate-400">{r.sub}</div>}
              </td>
              <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900">{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Zonas de estribos por tramo */
export function ZonesTable({ res }: { res: ContinuousResult; inp: ContinuousInputs }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-orange-600 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Zonas de estribos</div>
      <div className="scroll-thin max-h-[420px] overflow-auto">
        <table className="w-full text-right text-[13px]">
          <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
            <tr>
              {["Tramo", "De (ft)", "A (ft)", "Long. (ft)", "S (in)", "Estribos"].map((h, i) => (
                <th key={h} className={cn("border-b border-slate-300 px-3 py-2 font-semibold", i === 0 && "text-left")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {res.zones.map((z, i) => (
              <tr key={i} className={cn("border-b border-slate-100", z.status === "fail" && "bg-rose-50")}>
                <td className="px-3 py-1.5 text-left font-sans font-bold text-slate-700">{i === 0 || res.zones[i - 1].span !== z.span ? z.span + 1 : ""}</td>
                <td className="px-3 py-1.5">{f2(z.from)}</td>
                <td className="px-3 py-1.5">{f2(z.to)}</td>
                <td className="px-3 py-1.5 text-slate-500">{f2(z.to - z.from)}</td>
                <td className="px-3 py-1.5">{z.s > 0 ? <span className="rounded-md bg-orange-100 px-2 py-0.5 font-bold text-orange-800">{z.s % 1 ? z.s.toFixed(1) : z.s.toFixed(0)}</span> : <span className="text-slate-300">—</span>}</td>
                <td className="px-3 py-1.5 font-semibold">{z.count > 0 ? z.count : <span className="text-slate-300">—</span>}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-mono font-bold">
              <td colSpan={5} className="px-3 py-2 text-right font-sans text-slate-600">
                Total en la viga
              </td>
              <td className="px-3 py-2">{res.stirrupsTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
