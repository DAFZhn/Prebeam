import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo, useState, type ReactNode } from "react";
import type { Inputs, Result } from "../lib/calc";
import { STIRRUP_BARS } from "../lib/calc";
import { Badge } from "./ui";

function Tex({ children, block = true }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { throwOnError: false, displayMode: block, output: "html" }),
    [children, block]
  );
  return <div className={block ? "overflow-x-auto py-1 scroll-thin" : "inline"} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Step({ n, title, refText, children }: { n: number; title: string; refText?: string; children: ReactNode }) {
  return (
    <div className="card break-inside-avoid p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{n}</span>
        <h4 className="text-sm font-extrabold tracking-tight text-slate-800">{title}</h4>
        {refText && <Badge tone="blue">{refText}</Badge>}
      </div>
      {children}
    </div>
  );
}

const n = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "\\infty");

export default function Memoria({ inp, res }: { inp: Inputs; res: Result }) {
  const [idx, setIdx] = useState(1);
  const i = Math.min(idx, res.rows.length - 1);
  const r = res.rows[i];
  const is19 = inp.code === "318-19";
  const bar = STIRRUP_BARS[inp.stirrupBar];
  const Dead = res.Dead;
  const Vs = r.phiVs / inp.phi;
  const VcLb = (inp.lambda * 0.6 * res.fcSqrt + 700 * r.ratioUsed) * inp.bw * res.dReal;

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700" htmlFor="sec">
          Sección a detallar:
        </label>
        <select
          id="sec"
          value={i}
          onChange={(e) => setIdx(parseInt(e.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {res.rows.map((q, k) => (
            <option key={k} value={k}>
              x = {q.x.toFixed(2)} ft {q.isCritical ? "(crítica)" : k === 0 ? "(apoyo)" : k === res.rows.length - 1 ? "(centro de luz)" : ""}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">Los pasos 1, 2 y 6 son generales; 3 a 7 corresponden a esta sección.</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Step n={1} title="Cargas últimas y reacción" refText={is19 ? "ACI 318-19 §5.3.1" : "ACI 318-99 §9.2.1"}>
          <Tex>{String.raw`W_u=\gamma_D\,(w_{pp}+w_{losa}+w_{sup})+\gamma_L\,w_{viva}=${n(inp.gD, 2)}\,(${n(inp.wPP, 3)}+${n(inp.wLosa, 3)}+${n(inp.wSup, 3)})+${n(inp.gL, 2)}\,(${n(inp.wViva, 3)})=${n(res.Wu, 3)}\ \text{kip/ft}`}</Tex>
          <Tex>{String.raw`R_a=R_b=\dfrac{W_u\,L}{2}=\dfrac{${n(res.Wu, 3)}\,(${n(inp.L, 1)})}{2}=${n(res.Ra)}\ \text{kip}`}</Tex>
          <p className="text-[12px] text-slate-500">Dead = {Dead.toFixed(3)} kip/ft (peso propio + losa + superimpuesta).</p>
        </Step>

        <Step n={2} title="Peralte efectivo y propiedades" refText={is19 ? "ACI 318-19 §22.5.2.1" : "ACI 318-99 §11.4.3"}>
          <Tex>{String.raw`d=\max(d,\;0.8H)=\max(${n(inp.d)},\;${n(0.8 * inp.h)})=${n(res.dReal)}\ \text{in}=${n(res.dFt, 4)}\ \text{ft}`}</Tex>
          <Tex>{String.raw`\sqrt{f'_c}=\sqrt{${inp.fc}}=${n(res.fcSqrt, 2)}\ \text{psi}\qquad b_w=${n(inp.bw)}\ \text{in}`}</Tex>
          <Tex>{String.raw`A_p=${n(res.Ap, 3)}\ \text{in}^2\qquad A_v=${bar?.area ?? 0}\,(${inp.legs})=${n(res.Av, 2)}\ \text{in}^2`}</Tex>
        </Step>

        <Step n={3} title={`Fuerzas internas en x = ${r.x.toFixed(2)} ft`} refText="Equilibrio">
          <Tex>{String.raw`V_u=W_u\left(\dfrac{L}{2}-x\right)=${n(res.Wu, 3)}\,(${n(inp.L / 2, 2)}-${n(r.x, 2)})=${n(r.V)}\ \text{kip}`}</Tex>
          <Tex>{String.raw`M_u=\dfrac{W_u\,x\,(L-x)}{2}=\dfrac{${n(res.Wu, 3)}\,(${n(r.x, 2)})\,(${n(inp.L - r.x, 2)})}{2}=${n(r.M)}\ \text{kip·ft}`}</Tex>
          {inp.useTruck && (
            <Tex>{String.raw`V_{LT}=${n(r.Vt)}\ \text{kip}\ ;\quad M_{LT}=${n(r.Mt)}\ \text{kip·ft}\ \Rightarrow\ V_u=${n(r.Vu)},\ M_u=${n(r.Mu)}`}</Tex>
          )}
        </Step>

        <Step n={4} title="Resistencia del concreto Vc (método simplificado)" refText={is19 ? "ACI 318-19 §22.5.8.3" : "ACI 318-99 §11.4.2"}>
          <Tex>{String.raw`\dfrac{V_u\,d}{M_u}=\dfrac{${n(r.Vu)}\,(${n(res.dFt, 4)})}{${n(r.Mu)}}=${n(r.ratio, 3)}\ \Rightarrow\ \le 1.0\ \to\ ${n(r.ratioUsed, 3)}`}</Tex>
          <Tex>{String.raw`V_c=\left(0.6\lambda\sqrt{f'_c}+700\dfrac{V_u d}{M_u}\right)b_w\,d=\left(0.6\,(${n(inp.lambda, 2)})\,(${n(res.fcSqrt, 2)})+700\,(${n(r.ratioUsed, 3)})\right)(${n(inp.bw)})(${n(res.dReal)})=${n(VcLb / 1000)}\ \text{kip}`}</Tex>
          <Tex>{String.raw`V_{c,min}=2\lambda\sqrt{f'_c}\,b_w d=${n(res.VcMin)}\ \text{kip}\qquad V_{c,max}=5\lambda\sqrt{f'_c}\,b_w d=${n(res.VcMax)}\ \text{kip}`}</Tex>
          <Tex>{String.raw`\phi V_c=${n(inp.phi, 2)}\,(${n(VcLb / 1000)})=${n(r.phiVcCalc)}\ \to\ \boxed{\phi V_{c}=${n(r.phiVcUtil)}\ \text{kip}}\ \ (\text{entre }${n(r.phiVcMin)}\text{ y }${n(r.phiVcMax)})`}</Tex>
        </Step>

        <Step n={5} title="Cortante que debe tomar el acero" refText={is19 ? "ACI 318-19 §22.5.1.1 / 22.5.10.5" : "ACI 318-99 §11.5.6"}>
          <Tex>{String.raw`\phi V_s=V_u-\phi V_c=${n(r.Vu)}-${n(r.phiVcUtil)}=${n(r.phiVs)}\ \text{kip}`}</Tex>
          {r.phiVs > 0 ? (
            <>
              <Tex>{String.raw`V_s=\dfrac{\phi V_s}{\phi}=\dfrac{${n(r.phiVs)}}{${n(inp.phi, 2)}}=${n(Vs)}\ \text{kip}\ \ \le\ 8\sqrt{f'_c}\,b_w d=${n(res.Vs8)}\ \text{kip}\ \ ${Vs <= res.Vs8 ? String.raw`\checkmark` : String.raw`\times`}`}</Tex>
              <Tex>{String.raw`s_{teor}=\dfrac{A_v\,f_y\,d}{V_s}=\dfrac{${n(res.Av, 2)}\,(${n(inp.fy, 0)})\,(${n(res.dReal)})}{${n(Vs)}}=${n(r.sTheo)}\ \text{in}`}</Tex>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              φVs ≤ 0: el concreto resiste el cortante. {r.needsMin ? "Como Vu > φVc/2 se requiere refuerzo mínimo (rige S máx)." : "Como Vu ≤ φVc/2 no se requiere refuerzo por resistencia ni mínimo."}
            </p>
          )}
        </Step>

        <Step n={6} title="Separación máxima y refuerzo mínimo" refText={is19 ? "ACI 318-19 §9.6.3 y §9.7.6.2" : "ACI 318-99 §11.5.4 y §11.5.5"}>
          <Tex>{String.raw`\begin{aligned}
s_1&=d/2=${n(res.restr.dHalf)}\ \text{in}\qquad s_2=24\ \text{in}\qquad s_3=0.75H=${n(res.restr.threeQuarterH)}\ \text{in}\\
s_4&=\dfrac{A_v f_y}{${is19 ? String.raw`\max(50,\,0.75\sqrt{f'_c})` : "50"}\,b_w}=${n(res.restr.minAv50)}\ \text{in}\\
s_5&=\dfrac{80\,A_v f_y\,d}{f_{pu}\sqrt{d/b_w}\;A_p}=${n(res.restr.minAvPS)}\ \text{in}
\end{aligned}`}</Tex>
          <Tex>{String.raw`s_{max}=\min(s_1,\dots,s_5)=${n(res.restr.governing, 3)}\ \text{in}\ \ (\text{rige: ${res.restr.governingLabel.replace(/[√']/g, "")}})`}</Tex>
          {inp.halveSpacing && (
            <p className="text-[12px] text-slate-600">
              Con la opción activa: si Vs &gt; 4√f'c·bw·d = {res.Vs4.toFixed(2)} kip, s máx se reduce a la mitad
              {r.halved ? ` → ${r.sMax.toFixed(2)} in en esta sección.` : " (no aplica en esta sección)."}
            </p>
          )}
        </Step>

        <Step n={7} title="Separación adoptada y verificación" refText="Resultado">
          <Tex>{String.raw`s_{req}=${r.phiVs > 0 ? String.raw`\min(s_{teor},\,s_{max})=\min(${n(r.sTheo)},\,${n(r.sMax)})` : String.raw`s_{max}`}=${n(r.sReq)}\ \text{in}\ \Rightarrow\ \boxed{s_{real}=${r.sReal > 0 ? n(r.sReal, r.sReal % 1 ? 1 : 0) : "\\text{—}"}\ \text{in}}`}</Tex>
          {r.sReal > 0 && (
            <Tex>{String.raw`\phi V_n=\phi V_c+\dfrac{\phi A_v f_y d}{s}=${n(r.phiVcUtil)}+\dfrac{${n(inp.phi, 2)}\,(${n(res.Av, 2)})\,(${n(inp.fy, 0)})\,(${n(res.dReal)})}{${n(r.sReal, 1)}}=${n(r.phiVnProv)}\ \text{kip}\ ${r.phiVnProv >= r.Vu - 1e-9 ? String.raw`\ge V_u\ \checkmark` : String.raw`<V_u\ \times`}`}</Tex>
          )}
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="text-slate-500">D/C =</span>
            <span className="font-mono font-semibold">{r.dc > 0 ? r.dc.toFixed(3) : "—"}</span>
            <Badge tone={r.status === "fail" ? "red" : r.status === "ok" ? "green" : "blue"}>
              {r.status === "fail" ? "No cumple" : r.status === "ok" ? "Cumple" : r.status === "min" ? "Av,mín" : "No requiere"}
            </Badge>
          </div>
        </Step>
      </div>
    </div>
  );
}
