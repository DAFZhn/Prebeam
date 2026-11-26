import { useMemo, type ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { denseCurve, type Inputs, type Result } from "../lib/calc";

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

function tipFmt(v: unknown) {
  return typeof v === "number" ? v.toFixed(2) : String(v);
}

export default function Charts({ inp, res }: { inp: Inputs; res: Result }) {
  const data = useMemo(() => {
    const dense = denseCurve(inp, res, 120);
    const st = new Set(res.rows.map((r) => Math.round(r.x * 1e4) / 1e4));
    return dense.map((r) => {
      const isSt = st.has(Math.round(r.x * 1e4) / 1e4);
      const stRow = isSt ? res.rows.find((q) => Math.abs(q.x - r.x) < 1e-3) : undefined;
      return {
        x: Math.round(r.x * 1000) / 1000,
        Vu: r.Vu,
        phiVc: r.phiVcUtil,
        phiVcMin: r.phiVcMin,
        phiVcMax: r.phiVcMax,
        Mu: r.Mu,
        sTheo: r.sTheo > 0 ? r.sTheo : null,
        sMax: r.sMax,
        VuSt: isSt ? r.Vu : null,
        sReal: stRow && stRow.sReal > 0 ? stRow.sReal : stRow ? null : undefined,
      };
    });
  }, [inp, res]);

  const half = inp.L / 2;
  const ticks = useMemo(() => {
    const step = half <= 20 ? 2 : half <= 40 ? 5 : 10;
    const t: number[] = [];
    for (let v = 0; v <= half + 1e-6; v += step) t.push(v);
    if (Math.abs(t[t.length - 1] - half) > 1e-6) t.push(half);
    return t;
  }, [half]);

  const xAxis = (
    <XAxis
      dataKey="x"
      type="number"
      domain={[0, half]}
      ticks={ticks}
      tickFormatter={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))}
      tick={axisStyle}
      label={{ value: "Distancia desde el apoyo (ft)", position: "insideBottom", offset: -4, style: { ...axisStyle, fontWeight: 600 } }}
      height={44}
    />
  );
  const common = { data, margin: { top: 10, right: 16, left: 4, bottom: 4 } };
  const tooltip = (
    <Tooltip
      formatter={tipFmt}
      labelFormatter={(l) => `x = ${Number(l).toFixed(2)} ft`}
      contentStyle={{ borderRadius: 10, border: "1px solid #dbe3ee", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(15,23,42,.25)" }}
    />
  );
  const crit = res.xCrit > 0 && res.xCrit < half && (
    <ReferenceLine x={res.xCrit} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: "crít.", position: "top", fill: "#b45309", fontSize: 10 }} />
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <ChartCard
          title="Diagrama de cortante: demanda Vu vs. resistencia del concreto φVc"
          subtitle="Donde Vu supera φVc se requiere refuerzo a cortante (φVs = Vu − φVc). Los puntos marcan las secciones de la tabla."
        >
          <ResponsiveContainer>
            <ComposedChart {...common}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              {xAxis}
              <YAxis tick={axisStyle} label={{ value: "Esfuerzo de corte V (kip)", angle: -90, position: "insideLeft", style: { ...axisStyle, fontWeight: 600 } }} />
              {tooltip}
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Vu" name="Vu" stroke="none" fill="#2563eb" fillOpacity={0.07} isAnimationActive={false} legendType="none" />
              <Line type="linear" dataKey="Vu" name="Vu (demanda)" stroke="#2563eb" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="phiVc" name="φVc útil" stroke="#dc2626" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="phiVcMin" name="φVc mín" stroke="#16a34a" strokeWidth={1.8} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="phiVcMax" name="φVc máx" stroke="#7c3aed" strokeWidth={1.8} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="VuSt" name="Secciones de diseño" stroke="none" dot={{ r: 4, fill: "#2563eb", stroke: "#fff", strokeWidth: 1.5 }} activeDot={false} isAnimationActive={false} />
              {crit}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Momento último Mu" subtitle="Mu = Wu·x·(L − x)/2 (+ camión si se activó). Se usa en Vu·d/Mu para Vc.">
        <ResponsiveContainer>
          <ComposedChart {...common}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            {xAxis}
            <YAxis tick={axisStyle} label={{ value: "Mu (kip·ft)", angle: -90, position: "insideLeft", style: { ...axisStyle, fontWeight: 600 } }} />
            {tooltip}
            <Area type="monotone" dataKey="Mu" name="Mu" stroke="#0ea5e9" strokeWidth={2.5} fill="#0ea5e9" fillOpacity={0.15} isAnimationActive={false} />
            {crit}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Separación de estribos" subtitle="S teórico = Av·fy·d/Vs, limitado por S máx. La escalera naranja es la separación real colocada.">
        <ResponsiveContainer>
          <ComposedChart {...common}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            {xAxis}
            <YAxis
              tick={axisStyle}
              domain={[0, Math.ceil((res.restr.governing * 1.4) / 5) * 5]}
              allowDataOverflow
              label={{ value: "Separación s (in)", angle: -90, position: "insideLeft", style: { ...axisStyle, fontWeight: 600 } }}
            />
            {tooltip}
            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="sTheo" name="S teórico" stroke="#0ea5e9" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="linear" dataKey="sMax" name="S máx" stroke="#dc2626" strokeWidth={1.8} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="sReal" name="S real" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 3.5, fill: "#ea580c", stroke: "#fff", strokeWidth: 1 }} connectNulls isAnimationActive={false} />
            {crit}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
