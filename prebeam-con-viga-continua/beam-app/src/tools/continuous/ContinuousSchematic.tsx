import { Badge } from "../../components/ui";
import type { ContinuousInputs, ContinuousResult } from "./engine";
import { f2, nodeName } from "./format";

/** Elevación esquemática de toda la viga: apoyos, cargas y distribución de estribos */
export default function ContinuousSchematic({ inp, res }: { inp: ContinuousInputs; res: ContinuousResult }) {
  const X0 = 60;
  const X1 = 940;
  const sc = (X1 - X0) / res.total;
  const px = (X: number) => X0 + X * sc;
  const yTop = 135;
  const yBot = 195;
  const n = inp.spans.length;
  const maxS = Math.max(...res.zones.map((z) => z.s), 1);

  const stirrups: number[] = [];
  res.zones.forEach((z) => {
    if (z.s <= 0) return;
    for (let j = 0; j < z.count; j++) {
      const x = z.from + ((j + 0.5) * z.s) / 12;
      if (x < z.to + 1e-6) stirrups.push(res.spanStart[z.span] + x);
    }
  });

  const arrows = (from: number, to: number) => {
    const out: number[] = [];
    const k = Math.max(2, Math.round(((to - from) * sc) / 28));
    for (let i = 0; i <= k; i++) out.push(from + ((to - from) * i) / k);
    return out;
  };

  return (
    <div className="card p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold tracking-tight text-slate-800">Esquema de la viga – elevación completa</h3>
          <p className="text-[11px] text-slate-500">Esquemático, a escala horizontal. Los estribos se dibujan en cada zona de separación constante.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="slate">
            {n} tramo{n > 1 ? "s" : ""} · {f2(res.total, 1)} ft
          </Badge>
          <Badge tone="red">
            {inp.stirrupBar} · {inp.legs} ramales
          </Badge>
          <Badge tone="green">{res.stirrupsTotal} estribos en la viga</Badge>
        </div>
      </div>

      <div className="scroll-thin overflow-x-auto">
        <svg viewBox="0 0 1000 330" className="w-full min-w-[760px]" role="img" aria-label="Elevación de la viga continua con apoyos, cargas y estribos">
          <defs>
            <pattern id="c-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#64748b" strokeWidth="1" />
            </pattern>
            <linearGradient id="c-concrete" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f1f5f9" />
              <stop offset="1" stopColor="#e2e8f0" />
            </linearGradient>
            <marker id="c-arrow" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L5 10 L10 0 z" fill="#b45309" />
            </marker>
            <marker id="c-arrowP" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0 0 L5 10 L10 0 z" fill="#be123c" />
            </marker>
          </defs>

          {/* cargas distribuidas por tramo */}
          {inp.spans.map((s, i) => {
            const a = px(res.spanStart[i]);
            const b = px(res.spanStart[i] + s.L);
            return (
              <g key={`w${i}`}>
                <rect x={a} y={78} width={b - a} height={6} fill="#f59e0b" fillOpacity={0.35} />
                {arrows(a + 3, b - 3).map((x, k) => (
                  <line key={k} x1={x} y1={84} x2={x} y2={yTop - 2} stroke="#b45309" strokeWidth="1" markerEnd="url(#c-arrow)" />
                ))}
                <text x={(a + b) / 2} y={70} textAnchor="middle" fontSize="11" fontWeight="600" fill="#92400e">
                  wD = {f2(s.wD, 3)} · wL = {f2(s.wL, 3)} k/ft
                </text>
              </g>
            );
          })}

          {/* viga */}
          <rect x={X0} y={yTop} width={X1 - X0} height={yBot - yTop} fill="url(#c-concrete)" stroke="#334155" strokeWidth="2" />

          {/* zonas de estribos */}
          {(() => {
            const maxOp = 0.5;
            return res.zones.map((z, i) => {
              const a = px(res.spanStart[z.span] + z.from);
              const w = (z.to - z.from) * sc;
              const op = z.s > 0 ? 0.1 + maxOp * (1 - z.s / maxS) : 0;
              return <rect key={i} x={a} y={yTop} width={w} height={yBot - yTop} fill={z.s > 0 ? "#f97316" : "url(#c-hatch)"} fillOpacity={z.s > 0 ? op : 0.35} />;
            });
          })()}
          {stirrups.map((X, i) => (
            <line key={i} x1={px(X)} y1={yTop + 6} x2={px(X)} y2={yBot - 6} stroke="#be123c" strokeWidth="1" />
          ))}
          {[yBot - 10, yBot - 18].map((y) => (
            <line key={y} x1={X0} y1={y} x2={X1} y2={y} stroke="#0f172a" strokeWidth="2" />
          ))}

          {/* cargas puntuales */}
          {inp.points.map((p, k) => {
            const X = px(res.spanStart[Math.min(p.span, n - 1)] + p.a);
            return (
              <g key={`p${k}`}>
                <line x1={X} y1={30} x2={X} y2={yTop - 1} stroke="#be123c" strokeWidth="2.2" markerEnd="url(#c-arrowP)" />
                <text x={X} y={22} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#9f1239">
                  {f2(p.P, 1)} k ({p.kind})
                </text>
              </g>
            );
          })}

          {/* apoyos */}
          {res.nodes.map((nd) => {
            const X = px(nd.X);
            const isLeft = nd.index === 0;
            if (nd.kind === "libre") return null;
            if (nd.kind === "empotramiento") {
              const w = 22;
              const x = isLeft ? X - w : X;
              return (
                <g key={nd.index}>
                  <rect x={x} y={yTop - 14} width={w} height={yBot - yTop + 28} fill="url(#c-hatch)" stroke="#334155" strokeWidth="1.5" />
                  <line x1={X} y1={yTop - 14} x2={X} y2={yBot + 14} stroke="#334155" strokeWidth="3" />
                </g>
              );
            }
            return <polygon key={nd.index} points={`${X},${yBot} ${X - 15},${yBot + 26} ${X + 15},${yBot + 26}`} fill="#334155" />;
          })}

          {/* etiquetas de nodos */}
          {res.nodes.map((nd) => (
            <text key={`l${nd.index}`} x={px(nd.X)} y={yBot + 46} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">
              {nodeName(nd.index)}
            </text>
          ))}

          {/* cotas de los tramos */}
          {inp.spans.map((s, i) => {
            const a = px(res.spanStart[i]);
            const b = px(res.spanStart[i] + s.L);
            return (
              <g key={`d${i}`}>
                <line x1={a} y1={278} x2={b} y2={278} stroke="#475569" strokeWidth="1" />
                <line x1={a} y1={272} x2={a} y2={284} stroke="#475569" />
                <line x1={b} y1={272} x2={b} y2={284} stroke="#475569" />
                <text x={(a + b) / 2} y={296} textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
                  Tramo {i + 1} · L = {f2(s.L, 1)} ft
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
