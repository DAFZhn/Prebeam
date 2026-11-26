import { Anchor, Boxes, Cable, ClipboardList, FlaskConical, Ruler, Settings2, Truck, Weight } from "lucide-react";
import {
  CODE_PRESETS,
  STIRRUP_BARS,
  STRAND_TYPES,
  strandArea,
  type Code,
  type CriticalRule,
  type Inputs,
  type Result,
} from "../lib/calc";
import { NumField, PanelGroup, SelectField, TextField, Toggle } from "./ui";

interface Props {
  inp: Inputs;
  set: (patch: Partial<Inputs>) => void;
  res: Result | null;
}

export default function InputPanel({ inp, set, res }: Props) {
  const Ap = strandArea(inp.strands);
  const Av = (STIRRUP_BARS[inp.stirrupBar]?.area ?? 0) * inp.legs;

  const setCode = (c: Code) => set({ code: c, ...CODE_PRESETS[c] });
  const setStrand = (i: number, patch: Partial<{ type: string; qty: number }>) =>
    set({ strands: inp.strands.map((s, k) => (k === i ? { ...s, ...patch } : s)) });

  const fcKsi = inp.fc / 1000;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <ClipboardList className="h-4 w-4 text-blue-600" />
        <h2 className="text-sm font-extrabold tracking-tight text-slate-800">Datos de entrada</h2>
        <span className="ml-auto text-[11px] text-slate-400">sistema inglés · kip, ft, in</span>
      </div>

      <PanelGroup title="Proyecto" icon={<Boxes className="h-3.5 w-3.5" />} tone="slate">
        <TextField label="Proyecto" value={inp.project} onChange={(v) => set({ project: v })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Elemento" value={inp.element} onChange={(v) => set({ element: v })} />
          <TextField label="Calculó" value={inp.author} onChange={(v) => set({ author: v })} placeholder="Ing." />
        </div>
      </PanelGroup>

      <PanelGroup title="Norma y factores" icon={<Settings2 className="h-3.5 w-3.5" />} tone="amber">
        <SelectField
          label="Norma de referencia"
          value={inp.code}
          onChange={(v) => setCode(v as Code)}
          options={[
            { value: "318-19", label: "ACI 318-19 (φ = 0.75 · 1.2D + 1.6L)" },
            { value: "318-99", label: "ACI 318-99 · como tu hoja de Excel (φ = 0.85 · 1.4D + 1.7L)" },
          ]}
        />
        <div className="grid grid-cols-3 gap-2">
          <NumField label="φ cortante" value={inp.phi} onChange={(v) => set({ phi: v })} />
          <NumField label="γ carga muerta" value={inp.gD} onChange={(v) => set({ gD: v })} />
          <NumField label="γ carga viva" value={inp.gL} onChange={(v) => set({ gL: v })} />
        </div>
      </PanelGroup>

      <PanelGroup title="Materiales" icon={<FlaskConical className="h-3.5 w-3.5" />} tone="green">
        <div className="grid grid-cols-2 gap-3">
          <NumField label="f'c" unit="psi" value={inp.fc} onChange={(v) => set({ fc: v })} hint={`= ${fcKsi.toFixed(2)} ksi`} />
          <NumField label="λ concreto" value={inp.lambda} onChange={(v) => set({ lambda: v })} hint="1.0 normal" />
          <NumField label="fy estribos" unit="ksi" value={inp.fy} onChange={(v) => set({ fy: v })} />
          <NumField label="fpu torones" unit="ksi" value={inp.fpu} onChange={(v) => set({ fpu: v })} />
        </div>
      </PanelGroup>

      <PanelGroup title="Geometría" icon={<Ruler className="h-3.5 w-3.5" />}>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Luz L" unit="ft" value={inp.L} onChange={(v) => set({ L: v })} hint={`${(inp.L * 12).toFixed(0)} in`} />
          <NumField label="Altura H" unit="in" value={inp.h} onChange={(v) => set({ h: v })} />
          <NumField label="Ancho alma bw" unit="in" value={inp.bw} onChange={(v) => set({ bw: v })} />
          <NumField
            label="Peralte d"
            unit="in"
            value={inp.d}
            onChange={(v) => set({ d: v })}
            hint={res ? `real: ${res.dReal.toFixed(2)}` : undefined}
          />
        </div>
        <p className="text-[11px] leading-snug text-slate-500">
          Se usa <b>d = máx(d, 0.8H)</b> para cortante (ACI 318-19 §22.5.2.1).
        </p>
      </PanelGroup>

      <PanelGroup title="Torones de pretensado" icon={<Cable className="h-3.5 w-3.5" />} tone="blue">
        {inp.strands.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_84px] gap-2">
            <SelectField
              label={i === 0 ? "Tipo de torón" : undefined}
              value={s.type}
              onChange={(v) => setStrand(i, { type: v })}
              options={Object.entries(STRAND_TYPES).map(([k, v]) => ({ value: k, label: `${v.label}${v.area ? " · " + v.area + " in²" : ""}` }))}
            />
            <div className={i === 0 ? "" : ""}>
              {i === 0 && <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cant.</span>}
              <NumFieldInline value={s.qty} onChange={(v) => setStrand(i, { qty: Math.max(0, Math.round(v)) })} />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
          <span className="font-semibold text-blue-900">Ap total</span>
          <span className="font-mono font-semibold text-blue-900">{Ap.toFixed(3)} in²</span>
        </div>
      </PanelGroup>

      <PanelGroup title="Refuerzo transversal (estribos)" icon={<Anchor className="h-3.5 w-3.5" />} tone="red">
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Barra"
            value={inp.stirrupBar}
            onChange={(v) => set({ stirrupBar: v })}
            options={Object.entries(STIRRUP_BARS).map(([k, v]) => ({ value: k, label: `${v.label} · ${v.area}` }))}
          />
          <NumField label="# ramales" value={inp.legs} onChange={(v) => set({ legs: Math.max(1, Math.round(v)) })} />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm">
          <span className="font-semibold text-rose-900">Av = área × ramales</span>
          <span className="font-mono font-semibold text-rose-900">{Av.toFixed(2)} in²</span>
        </div>
      </PanelGroup>

      <PanelGroup title="Cargas distribuidas" icon={<Weight className="h-3.5 w-3.5" />} tone="red">
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Peso propio" unit="k/ft" value={inp.wPP} onChange={(v) => set({ wPP: v })} />
          <NumField label="Losa" unit="k/ft" value={inp.wLosa} onChange={(v) => set({ wLosa: v })} />
          <NumField label="Superimpuesta" unit="k/ft" value={inp.wSup} onChange={(v) => set({ wSup: v })} />
          <NumField label="Viva" unit="k/ft" value={inp.wViva} onChange={(v) => set({ wViva: v })} />
        </div>
        <Toggle
          checked={inp.useTruck}
          onChange={(v) => set({ useTruck: v })}
          label="Añadir camión (ecuaciones de la hoja)"
          hint="V_LT = 72·[(L−x)−9.33]/L ; M_LT = 72·x·[(L−x)−4.67]/L − 112, multiplicado por γ de carga viva."
        />
        {inp.useTruck && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            <Truck className="h-4 w-4 shrink-0" /> Las acciones del camión se suman a la carga distribuida.
          </div>
        )}
      </PanelGroup>

      <PanelGroup title="Opciones de la tabla" icon={<Settings2 className="h-3.5 w-3.5" />} tone="slate">
        <SelectField
          label="Primera sección crítica"
          value={inp.critical}
          onChange={(v) => set({ critical: v as CriticalRule })}
          options={[
            { value: "d/2", label: "x = d/2 (como la hoja)" },
            { value: "h/2", label: "x = h/2 (pretensado, ACI 9.4.3.2)" },
            { value: "d", label: "x = d" },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Paso entre secciones" unit="ft" value={inp.step} onChange={(v) => set({ step: v })} />
          <SelectField
            label="Redondeo S real"
            value={String(inp.rounding)}
            onChange={(v) => set({ rounding: parseFloat(v) })}
            options={[
              { value: "0.5", label: "½ in" },
              { value: "1", label: "1 in" },
              { value: "2", label: "2 in" },
            ]}
          />
        </div>
        <Toggle
          checked={inp.halveSpacing}
          onChange={(v) => set({ halveSpacing: v })}
          label="Reducir S máx a la mitad si Vs > 4√f'c·bw·d"
          hint="Requisito del ACI 318-19 §9.7.6.2.2 (la hoja original no lo aplica)."
        />
      </PanelGroup>
    </div>
  );
}

function NumFieldInline({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    />
  );
}
