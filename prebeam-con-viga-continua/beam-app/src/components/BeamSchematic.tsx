import type { Inputs, Result } from "../lib/calc";
import { STIRRUP_BARS, strandArea } from "../lib/calc";
import { Badge } from "./ui";

export function BeamSchematic({ inp, res }: { inp: Inputs; res: Result }) {
  const half = inp.L / 2;
  const X0 = 70;
  const X1 = 930;
  const sc = (X1 - X0) / half;
  const px = (x: number) => X0 + x * sc;
  const yTop = 105;
  const yBot = 215;
  const maxS = Math.max(...res.zones.map((z) => z.s), 1);

  const stirrups: number[] = [];
  res.zones.forEach((z) => {
    if (z.s <= 0) return;
    for (let j = 0; j < z.count; j++) {
      const x = z.from + ((j + 0.5) * z.s) / 12;
      if (x < z.to + 1e-6) stirrups.push(x);
    }
  });

  return (
    <div className="card p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold tracking-tight text-slate-800">Distribución de estribos – elevación (semi-luz)</h3>
          <p className="text-[11px] text-slate-500">Esquemático, a escala horizontal. La viga es simétrica respecto al centro de luz.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="red">{inp.stirrupBar} · {inp.legs} ramales</Badge>
          <Badge tone="blue">{res.stirrupsHalf} estribos / semi-luz</Badge>
          <Badge tone="green">{res.stirrupsTotal} en la viga</Badge>
        </div>
      </div>
      <div className="overflow-x-auto scroll-thin">
        <svg viewBox="0 0 1000 310" className="min-w-[760px] w-full" role="img" aria-label="Elevación de la viga con distribución de estribos">
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="1" />
            </pattern>
            <linearGradient id="concrete" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f1f5f9" />
              <stop offset="1" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* viga */}
          <rect x={X0} y={yTop} width={X1 - X0} height={yBot - yTop} fill="url(#concrete)" stroke="#334155" strokeWidth="2" />
          <line x1={X0} y1={yTop + 18} x2={X1} y2={yTop + 18} stroke="#94a3b8" strokeDasharray="5 4" />
          <line x1={X0} y1={yBot - 18} x2={X1} y2={yBot - 18} stroke="#94a3b8" strokeDasharray="5 4" />

          {/* zonas */}
          {res.zones.map((z, i) => {
            const w = (z.to - z.from) * sc;
            const op = z.s > 0 ? 0.12 + 0.4 * (1 - z.s / maxS) : 0;
            return (
              <g key={i}>
                <rect x={px(z.from)} y={yTop} width={w} height={yBot - yTop} fill={z.s > 0 ? "#f97316" : "url(#hatch)"} fillOpacity={z.s > 0 ? op : 0.5} />
                {i > 0 && <line x1={px(z.from)} y1={yTop - 38} x2={px(z.from)} y2={yBot + 40} stroke="#cbd5e1" strokeDasharray="2 3" />}
              </g>
            );
          })}

          {/* estribos */}
          {stirrups.map((x, i) => (
            <line key={i} x1={px(x)} y1={yTop + 7} x2={px(x)} y2={yBot - 7} stroke="#be123c" strokeWidth="1.2" />
          ))}

          {/* torones */}
          {[yBot - 12, yBot - 22].map((y) => (
            <line key={y} x1={X0} y1={y} x2={X1} y2={y} stroke="#0f172a" strokeWidth="2.2" />
          ))}
          <text x={X1 - 6} y={yBot - 28} textAnchor="end" fontSize="10" fill="#0f172a" fontWeight="600">
            Ap = {strandArea(inp.strands).toFixed(2)} in² (torones, esquemático)
          </text>

          {/* apoyo */}
          <polygon points={`${X0},${yBot} ${X0 - 22},${yBot + 28} ${X0 + 22},${yBot + 28}`} fill="#334155" />
          <line x1={X0 - 32} y1={yBot + 30} x2={X0 + 32} y2={yBot + 30} stroke="#334155" strokeWidth="3" />
          <text x={X0} y={yBot + 48} textAnchor="middle" fontSize="11" fill="#475569" fontWeight="700">
            APOYO
          </text>

          {/* eje de simetría */}
          <line x1={X1} y1={yTop - 40} x2={X1} y2={yBot + 40} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="10 4 2 4" />
          <text x={X1} y={yTop - 46} textAnchor="middle" fontSize="11" fill="#2563eb" fontWeight="700">
            CL · L/2
          </text>

          {/* sección crítica */}
          {res.xCrit > 0 && res.xCrit < half && (
            <g>
              <line x1={px(res.xCrit)} y1={yTop - 4} x2={px(res.xCrit)} y2={yBot + 4} stroke="#f59e0b" strokeWidth="2" />
              <text x={px(res.xCrit)} y={yBot + 62} textAnchor="middle" fontSize="10" fill="#b45309" fontWeight="700">
                sección crítica
              </text>
            </g>
          )}

          {/* cotas superiores: separación */}
          {res.zones.map((z, i) => {
            const w = (z.to - z.from) * sc;
            const cx = px(z.from) + w / 2;
            return (
              <g key={i}>
                <line x1={px(z.from) + 1} y1={yTop - 22} x2={px(z.to) - 1} y2={yTop - 22} stroke="#334155" strokeWidth="1" />
                <line x1={px(z.from) + 1} y1={yTop - 26} x2={px(z.from) + 1} y2={yTop - 18} stroke="#334155" />
                <line x1={px(z.to) - 1} y1={yTop - 26} x2={px(z.to) - 1} y2={yTop - 18} stroke="#334155" />
                {w >= 34 && (
                  <text x={cx} y={yTop - 28} textAnchor="middle" fontSize="11" fontWeight="700" fill={z.s > 0 ? "#c2410c" : "#64748b"}>
                    {z.s > 0 ? `@${z.s % 1 ? z.s.toFixed(1) : z.s}″` : "s/e"}
                  </text>
                )}
              </g>
            );
          })}

          {/* cotas inferiores: posición */}
          <line x1={X0} y1={yBot + 82} x2={X1} y2={yBot + 82} stroke="#64748b" />
          {[0, ...res.zones.map((z) => z.to)].map((x, i, arr) => {
            const prev = i > 0 ? px(arr[i - 1]) : -100;
            const show = px(x) - prev >= 28 || i === arr.length - 1 || i === 0;
            return (
              <g key={i}>
                <line x1={px(x)} y1={yBot + 78} x2={px(x)} y2={yBot + 86} stroke="#64748b" />
                {show && (
                  <text x={px(x)} y={yBot + 98} textAnchor="middle" fontSize="10" fill="#475569" fontFamily="JetBrains Mono, monospace">
                    {x.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}
          <text x={X1 + 8} y={yBot + 86} fontSize="10" fill="#64748b">
            ft
          </text>
        </svg>
      </div>
    </div>
  );
}

export function ZonesSummary({ inp, res }: { inp: Inputs; res: Result }) {
  const bar = STIRRUP_BARS[inp.stirrupBar];
  const dia = bar ? bar.label.split(" ")[0] : inp.stirrupBar;
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h3 className="text-sm font-extrabold tracking-tight text-slate-800">Resumen de armado transversal</h3>
        <span className="text-[11px] text-slate-500">de apoyo a centro de luz</span>
      </div>
      <div className="scroll-thin max-h-[330px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2 text-left">Zona</th>
              <th className="px-3 py-2 text-right">Desde–hasta (ft)</th>
              <th className="px-3 py-2 text-right">Long. (ft)</th>
              <th className="px-3 py-2 text-left">Armado</th>
              <th className="px-3 py-2 text-right">N°</th>
            </tr>
          </thead>
          <tbody>
            {res.zones.map((z, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-3 py-1.5 font-semibold text-slate-500">Z{i + 1}</td>
                <td className="px-3 py-1.5 text-right font-mono text-[13px]">
                  {z.from.toFixed(2)} – {z.to.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-[13px]">{(z.to - z.from).toFixed(2)}</td>
                <td className="px-3 py-1.5">
                  {z.s > 0 ? (
                    <span className="font-semibold text-slate-800">
                      E{dia} @ {z.s % 1 ? z.s.toFixed(1) : z.s}″
                      {z.status === "min" && <span className="ml-1.5 text-[10px] font-bold text-blue-600">Av,mín</span>}
                    </span>
                  ) : (
                    <span className="text-slate-400">Sin estribos por resistencia</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-[13px]">{z.count || "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold">
              <td colSpan={4} className="px-3 py-2 text-right text-slate-600">
                Total semi-luz / viga completa
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {res.stirrupsHalf} / {res.stirrupsTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {res.zones.some((z) => z.s === 0) && (
        <p className="border-t border-slate-200 bg-amber-50 px-4 py-2 text-[11px] leading-snug text-amber-900">
          En las zonas "sin estribos" se cumple Vu ≤ φVc/2 (ACI 9.6.3.1). Por buena práctica se recomienda continuar el estribo con la separación máxima.
        </p>
      )}
    </div>
  );
}
