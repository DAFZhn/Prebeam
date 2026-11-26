import { Anchor, Boxes, Cable, ClipboardList, FlaskConical, Layers, Plus, Ruler, Settings2, Trash2, Weight } from "lucide-react";
import { CODE_PRESETS, STIRRUP_BARS, STRAND_TYPES, strandArea, type Code, type CriticalRule } from "../../lib/calc";
import { NumField, PanelGroup, SelectField, TextField, Toggle } from "../../components/ui";
import type { ContinuousInputs, ContinuousResult, EndCond, LoadKind, PointLoad, Span } from "./engine";

interface Props {
  inp: ContinuousInputs;
  set: (patch: Partial<ContinuousInputs>) => void;
  res: ContinuousResult | null;
}

export const MAX_SPANS = 8;

const END_OPTIONS: { value: EndCond; label: string }[] = [
  { value: "pinned", label: "Apoyo simple (articulado)" },
  { value: "fixed", label: "Empotrado" },
  { value: "free", label: "Voladizo (extremo libre)" },
];

const iconBtn =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600";
const addBtn =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40";

export default function ContinuousInputPanel({ inp, set }: Props) {
  const Ap = strandArea(inp.strands);
  const Av = (STIRRUP_BARS[inp.stirrupBar]?.area ?? 0) * inp.legs;
  const n = inp.spans.length;

  const setCode = (c: Code) => set({ code: c, ...CODE_PRESETS[c] });
  const setStrand = (i: number, patch: Partial<{ type: string; qty: number }>) =>
    set({ strands: inp.strands.map((s, k) => (k === i ? { ...s, ...patch } : s)) });

  const setSpan = (i: number, patch: Partial<Span>) => set({ spans: inp.spans.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const addSpan = () => {
    if (n >= MAX_SPANS) return;
    set({ spans: [...inp.spans, { ...inp.spans[n - 1] }] });
  };
  const removeSpan = (i: number) => {
    if (n <= 1) return;
    set({
      spans: inp.spans.filter((_, k) => k !== i),
      // las cargas puntuales del tramo eliminado se descartan y las de tramos posteriores se recorren
      points: inp.points.filter((p) => p.span !== i).map((p) => (p.span > i ? { ...p, span: p.span - 1 } : p)),
    });
  };

  const setPoint = (k: number, patch: Partial<PointLoad>) => set({ points: inp.points.map((p, j) => (j === k ? { ...p, ...patch } : p)) });
  const addPoint = () => set({ points: [...inp.points, { span: 0, a: Math.round((inp.spans[0].L / 2) * 100) / 100, P: 10, kind: "L" }] });
  const removePoint = (k: number) => set({ points: inp.points.filter((_, j) => j !== k) });

  const spanOptions = inp.spans.map((_, i) => ({ value: String(i), label: `Tramo ${i + 1}` }));

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

      <PanelGroup title="Tramos y apoyos" icon={<Ruler className="h-3.5 w-3.5" />} tone="blue">
        <div className="grid grid-cols-1 gap-2">
          <SelectField label="Extremo izquierdo" value={inp.leftEnd} onChange={(v) => set({ leftEnd: v as EndCond })} options={END_OPTIONS} />
          <SelectField label="Extremo derecho" value={inp.rightEnd} onChange={(v) => set({ rightEnd: v as EndCond })} options={END_OPTIONS} />
        </div>
        <p className="text-[11px] leading-snug text-slate-500">
          Los apoyos intermedios son simples. En un voladizo, el tramo del extremo libre es el volado; necesita al menos dos apoyos verticales en el resto de la viga.
        </p>
        {inp.spans.map((s, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Tramo {i + 1}
                {i === 0 && inp.leftEnd === "free" && <span className="ml-1.5 font-normal text-amber-600">· voladizo</span>}
                {i === n - 1 && inp.rightEnd === "free" && <span className="ml-1.5 font-normal text-amber-600">· voladizo</span>}
              </span>
              <button type="button" className={iconBtn} onClick={() => removeSpan(i)} disabled={n <= 1} title="Quitar tramo" aria-label={`Quitar tramo ${i + 1}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumField label="Luz" unit="ft" value={s.L} onChange={(v) => setSpan(i, { L: v })} />
              <NumField label="EI relativo" value={s.EIrel} onChange={(v) => setSpan(i, { EIrel: v })} hint="1 = igual" />
              <NumField label="Muerta wD" unit="k/ft" value={s.wD} onChange={(v) => setSpan(i, { wD: v })} />
              <NumField label="Viva wL" unit="k/ft" value={s.wL} onChange={(v) => setSpan(i, { wL: v })} />
            </div>
          </div>
        ))}
        <button type="button" className={addBtn} onClick={addSpan} disabled={n >= MAX_SPANS}>
          <Plus className="h-3.5 w-3.5" /> Agregar tramo {n >= MAX_SPANS && `(máx. ${MAX_SPANS})`}
        </button>
        <p className="text-[11px] leading-snug text-slate-500">wD incluye el peso propio de la viga. Las cargas son de servicio; se factorizan con γD y γL.</p>
      </PanelGroup>

      <PanelGroup title="Cargas puntuales" icon={<Weight className="h-3.5 w-3.5" />} tone="red">
        {inp.points.length === 0 && <p className="text-[11px] text-slate-500">Sin cargas puntuales. Agrega las que necesites (columnas, diafragmas, ejes de camión…).</p>}
        {inp.points.map((p, k) => (
          <div key={k} className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Carga {k + 1}</span>
              <button type="button" className={iconBtn} onClick={() => removePoint(k)} title="Quitar carga" aria-label={`Quitar carga ${k + 1}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SelectField label="Tramo" value={String(Math.min(p.span, n - 1))} onChange={(v) => setPoint(k, { span: parseInt(v) })} options={spanOptions} />
              <SelectField
                label="Tipo"
                value={p.kind}
                onChange={(v) => setPoint(k, { kind: v as LoadKind })}
                options={[
                  { value: "D", label: "Muerta (D)" },
                  { value: "L", label: "Viva (L)" },
                ]}
              />
              <NumField label="Posición a" unit="ft" value={p.a} onChange={(v) => setPoint(k, { a: v })} hint="desde la izq. del tramo" />
              <NumField label="Carga P" unit="kip" value={p.P} onChange={(v) => setPoint(k, { P: v })} hint="↓ positiva" />
            </div>
          </div>
        ))}
        <button type="button" className={addBtn} onClick={addPoint}>
          <Plus className="h-3.5 w-3.5" /> Agregar carga puntual
        </button>
        <Toggle
          checked={inp.pattern}
          onChange={(v) => set({ pattern: v })}
          label="Alternancia de carga viva"
          hint="Envolvente cargando y descargando tramos (ACI 318-19 §6.4.3). Si se apaga, toda la carga viva actúa a la vez."
        />
      </PanelGroup>

      <PanelGroup title="Norma y factores" icon={<Settings2 className="h-3.5 w-3.5" />} tone="amber">
        <SelectField
          label="Norma de referencia"
          value={inp.code}
          onChange={(v) => setCode(v as Code)}
          options={[
            { value: "318-19", label: "ACI 318-19 (φ = 0.75 · 1.2D + 1.6L)" },
            { value: "318-99", label: "ACI 318-99 (φ = 0.85 · 1.4D + 1.7L)" },
          ]}
        />
        <div className="grid grid-cols-3 gap-2">
          <NumField label="φ cortante" value={inp.phi} onChange={(v) => set({ phi: v })} />
          <NumField label="γ muerta" value={inp.gD} onChange={(v) => set({ gD: v })} />
          <NumField label="γ viva" value={inp.gL} onChange={(v) => set({ gL: v })} />
        </div>
      </PanelGroup>

      <PanelGroup title="Materiales" icon={<FlaskConical className="h-3.5 w-3.5" />} tone="green">
        <div className="grid grid-cols-2 gap-3">
          <NumField label="f'c" unit="psi" value={inp.fc} onChange={(v) => set({ fc: v })} hint={`= ${(inp.fc / 1000).toFixed(2)} ksi`} />
          <NumField label="λ concreto" value={inp.lambda} onChange={(v) => set({ lambda: v })} hint="1.0 normal" />
          <NumField label="fy estribos" unit="ksi" value={inp.fy} onChange={(v) => set({ fy: v })} />
          <NumField label="fy long." unit="ksi" value={inp.fyL} onChange={(v) => set({ fyL: v })} hint="acero ordinario" />
          <NumField label="fpu torones" unit="ksi" value={inp.fpu} onChange={(v) => set({ fpu: v })} />
          <NumField label="fse efectivo" unit="ksi" value={inp.fse} onChange={(v) => set({ fse: v })} hint="pretensado" />
        </div>
      </PanelGroup>

      <PanelGroup title="Sección para cortante" icon={<Layers className="h-3.5 w-3.5" />}>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Altura H" unit="in" value={inp.h} onChange={(v) => set({ h: v })} />
          <NumField label="Ancho alma bw" unit="in" value={inp.bw} onChange={(v) => set({ bw: v })} />
          <NumField label="Peralte d" unit="in" value={inp.d} onChange={(v) => set({ d: v })} hint="se usa máx(d, 0.8H)" />
          <NumField label="Ancho de apoyo" unit="in" value={inp.supportWidth} onChange={(v) => set({ supportWidth: v })} hint="cara del apoyo" />
        </div>
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
            <div>
              {i === 0 && <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cant.</span>}
              <input
                type="number"
                min={0}
                value={s.qty}
                onChange={(e) => setStrand(i, { qty: Math.max(0, Math.round(parseFloat(e.target.value) || 0)) })}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
          <span className="font-semibold text-blue-900">Ap total</span>
          <span className="font-mono font-semibold text-blue-900">{Ap.toFixed(3)} in²</span>
        </div>
        <p className="text-[11px] leading-snug text-slate-500">Se supone pretensado adherido y trazado recto (sin harping), constante en toda la viga.</p>
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

      <PanelGroup title="Flexión" icon={<Ruler className="h-3.5 w-3.5" />} tone="green">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Momento positivo (torones + acero inferior)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Ancho ala bf" unit="in" value={inp.bf} onChange={(v) => set({ bf: v })} />
          <NumField label="Espesor ala hf" unit="in" value={inp.hf} onChange={(v) => set({ hf: v })} />
          <NumField label="Peralte dp" unit="in" value={inp.dp} onChange={(v) => set({ dp: v })} hint="a los torones" />
          <NumField label="As inferior" unit="in²" value={inp.asBot} onChange={(v) => set({ asBot: v })} hint="opcional" />
        </div>
        <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Momento negativo (acero ordinario superior)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="As superior" unit="in²" value={inp.asTop} onChange={(v) => set({ asTop: v })} hint="en apoyos" />
          <NumField label="Peralte d" unit="in" value={inp.dNeg} onChange={(v) => set({ dNeg: v })} hint="fibra inf. → As sup." />
          <NumField label="Ancho compr." unit="in" value={inp.bNeg} onChange={(v) => set({ bNeg: v })} hint="patín inferior" />
          <NumField label="φ flexión" value={inp.phiF} onChange={(v) => set({ phiF: v })} hint="máx." />
        </div>
      </PanelGroup>

      <PanelGroup title="Opciones de la tabla" icon={<Settings2 className="h-3.5 w-3.5" />} tone="slate">
        <SelectField
          label="Sección crítica (desde la cara del apoyo)"
          value={inp.critical}
          onChange={(v) => set({ critical: v as CriticalRule })}
          options={[
            { value: "h/2", label: "h/2 (pretensado, ACI 9.4.3.2)" },
            { value: "d/2", label: "d/2 (como la hoja)" },
            { value: "d", label: "d" },
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
          hint="Requisito del ACI 318-19 §9.7.6.2.2."
        />
      </PanelGroup>
    </div>
  );
}
