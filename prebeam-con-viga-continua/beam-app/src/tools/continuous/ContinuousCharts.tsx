import { useMemo, type ReactNode } from "react";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ContinuousInputs, ContinuousResult } from "./engine";
import { nodeName } from "./format";

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="mb-2">
        <h3 className="text-sm font-extrabold tracking-tight text-slate-800">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="h-[340px] w-full">{children}</div>
    </div>
  );
}

const axisStyle = { fontSize: 11, fill: "#64748b" };
const tipFmt = (v: unknown) => (typeof v === "number" ? v.toFixed(2) : String(v));

export default function ContinuousCharts({ inp, res }: { inp: ContinuousInputs; res: ContinuousResult }) {
  const ticks = useMemo(() => {
    const step = res.total <= 60 ? 5 : res.total <= 150 ? 10 : res.total <= 400 ? 20 : 50;
    const t: number[] = [];
    for (let v = 0; v <= res.total + 1e-6; v += step) t.push(v);
    if (Math.abs(t[t.length - 1] - res.total) > 1e-6) t.push(res.total);
    return t;
  }, [res.total]);

  const stirData = useMemo(() => {
    const out: { X: number; sReal: number | null; sMax: number }[] = [];
    res.zones.forEach((z) => {
      const a = res.spanStart[z.span] + z.from;
      const b = res.spanStart[z.span] + z.to;
      const s = z.s > 0 ? z.s : null;
      out.push({ X: a, sReal: s, sMax: res.ctx.restr.governing });
      out.push({ X: b, sReal: s, sMax: res.ctx.restr.governing });
    });
    return out;
  }, [res]);

  const xAxis = (
    <XAxis
      dataKey="X"
      type="number"
      domain={[0, res.total]}
      ticks={ticks}
      tickFormatter={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))}
      tick={axisStyle}
      label={{ value: "Distancia desde el extremo izquierdo (ft)", position: "insideBottom", offset: -4, style: { ...axisStyle, fontWeight: 600 } }}
      height={44}
    />
  );
  const nodeLines = res.nodes.map((nd) => (
    <ReferenceLine key={nd.index} x={nd.X} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: nodeName(nd.index), position: "top", fill: "#475569", fontSize: 11, fontWeight: 700 }} />
  ));
  const common = { margin: { top: 18, right: 16, left: 4, bottom: 4 } };
  const tooltip = (
    <Tooltip
      formatter={tipFmt}
      labelFormatter={(l) => `X = ${Number(l).toFixed(2)} ft`}
      contentStyle={{ borderRadius: 10, border: "1px solid #dbe3ee", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(15,23,42,.25)" }}
    />
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <ChartCard
          title="Envolvente de cortante último Vu"
          subtitle={inp.pattern ? "Máximo y mínimo con alternancia de carga viva (1.2D + 1.6L por patrones)." : "Con toda la carga viva actuando a la vez."}
        >
          <ResponsiveContainer>
            <ComposedChart data={res.dense} {...common}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              {xAxis}
              <YAxis tick={axisStyle} label={{ value: "Vu (kip)", angle: -90, position: "insideLeft", style: { ...axisStyle, fontWeight: 600 } }} />
              {tooltip}
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Area type="linear" dataKey="Vpos" name="Vu máx" stroke="#2563eb" strokeWidth={2.2} fill="#2563eb" fillOpacity={0.1} isAnimationActive={false} />
              <Area type="linear" dataKey="Vneg" name="Vu mín" stroke="#dc2626" strokeWidth={2.2} fill="#dc2626" fillOpacity={0.1} isAnimationActive={false} />
              {nodeLines}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="xl:col-span-2">
        <ChartCard
          title="Envolvente de momento último Mu vs. resistencia φMn"
          subtitle="Positivo = tracción en la fibra inferior. Las líneas punteadas son φMn+ (torones + acero inferior) y −φMn− (acero superior), constantes en toda la viga."
        >
          <ResponsiveContainer>
            <ComposedChart data={res.dense} {...common}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              {xAxis}
              <YAxis tick={axisStyle} label={{ value: "Mu (kip·ft)", angle: -90, position: "insideLeft", style: { ...axisStyle, fontWeight: 600 } }} />
              {tooltip}
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Area type="linear" dataKey="Mpos" name="Mu+ máx" stroke="#0ea5e9" strokeWidth={2.2} fill="#0ea5e9" fillOpacity={0.15} isAnimationActive={false} />
              <Area type="linear" dataKey="Mneg" name="Mu− mín" stroke="#7c3aed" strokeWidth={2.2} fill="#7c3aed" fillOpacity={0.15} isAnimationActive={false} />
              {res.flex.phiMnPos > 0 && (
                <ReferenceLine y={res.flex.phiMnPos} stroke="#16a34a" strokeDasharray="6 4" strokeWidth={1.8} ifOverflow="extendDomain" label={{ value: `φMn+ = ${res.flex.phiMnPos.toFixed(0)}`, position: "insideTopRight", fill: "#15803d", fontSize: 11 }} />
              )}
              {res.flex.phiMnNeg > 0 && (
                <ReferenceLine y={-res.flex.phiMnNeg} stroke="#dc2626" strokeDasharray="6 4" strokeWidth={1.8} ifOverflow="extendDomain" label={{ value: `−φMn− = −${res.flex.phiMnNeg.toFixed(0)}`, position: "insideBottomRight", fill: "#b91c1c", fontSize: 11 }} />
              )}
              {nodeLines}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="xl:col-span-2">
        <ChartCard title="Separación de estribos a lo largo de la viga" subtitle="La línea naranja es la separación real colocada en cada zona; la roja, la separación máxima que rige.">
          <ResponsiveContainer>
            <ComposedChart data={stirData} {...common}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              {xAxis}
              <YAxis
                tick={axisStyle}
                domain={[0, Math.ceil((res.ctx.restr.governing * 1.4) / 5) * 5]}
                allowDataOverflow
                label={{ value: "Separación s (in)", angle: -90, position: "insideLeft", style: { ...axisStyle, fontWeight: 600 } }}
              />
              {tooltip}
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
              <Line type="linear" dataKey="sMax" name="S máx" stroke="#dc2626" strokeWidth={1.8} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="sReal" name="S real" stroke="#ea580c" strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
              {nodeLines}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
