import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";

export function NumField({ label, unit, value, onChange, hint, className }: {
  label: ReactNode; unit?: string; value: number; onChange: (v: number) => void; hint?: string; className?: string;
}) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { if (parseFloat(txt) !== value) setTxt(String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="field-label flex items-center justify-between gap-2">
        <span>{label}</span>{hint && <span className="font-mono text-[9px] font-normal normal-case tracking-normal text-slate-400">{hint}</span>}
      </span>
      <span className="field-control flex items-stretch overflow-hidden">
        <input type="text" inputMode="decimal" value={txt}
          onChange={(e) => { const v = e.target.value.replace(",", "."); setTxt(v); const n = parseFloat(v); if (!isNaN(n)) onChange(n); }}
          onFocus={(e) => { const t = e.currentTarget; requestAnimationFrame(() => t.select()); }}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          onBlur={() => setTxt(String(value))}
          className="min-w-0 w-full bg-transparent px-2.5 py-2 font-mono text-xs font-medium outline-none" />
        {unit && <span className="flex items-center border-l border-slate-200 bg-[#eff0e8] px-2 font-mono text-[9px] text-slate-500">{unit}</span>}
      </span>
    </label>
  );
}

export function SelectField({ label, value, onChange, options, className }: {
  label?: ReactNode; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return <label className={cn("block min-w-0", className)}>
    {label && <span className="field-label">{label}</span>}
    <select value={value} onChange={(e) => onChange(e.target.value)} className="field-control">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>;
}

export function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return <label className="block min-w-0">
    <span className="field-label">{label}</span>
    <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      className="field-control px-2.5 py-2 text-xs outline-none" />
  </label>;
}

export function Toggle({ checked, onChange, label, hint }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string;
}) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
    className="flex w-full items-start gap-3 rounded-lg border border-[#d4d7cc] bg-[#f4f5ee] p-3 text-left transition hover:border-[#111310]">
    <span className={cn("mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-[#111310] p-0.5 transition", checked ? "justify-end bg-[#c7f36b]" : "justify-start bg-[#d4d7cc]")}>
      <span className="h-3.5 w-3.5 rounded-full bg-[#111310]" />
    </span>
    <span><span className="block text-xs font-bold text-[#111310]">{label}</span>
      {hint && <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{hint}</span>}</span>
  </button>;
}

export function PanelGroup({ title, icon, children, tone = "blue" }: {
  title: string; icon?: ReactNode; children: ReactNode; tone?: "blue" | "red" | "green" | "amber" | "slate";
}) {
  const bar = { blue: "bg-[#c7f36b]", red: "bg-[#ff6038]", green: "bg-[#76aa72]", amber: "bg-[#f0c94c]", slate: "bg-[#7c8175]" }[tone];
  return <section className="border-b border-[#dcdfd4] px-4 py-5 last:border-0">
    <h3 className="mb-4 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#292d25]">
      <span className={cn("h-4 w-1.5", bar)} />{icon}{title}
    </h3>
    <div className="space-y-3">{children}</div>
  </section>;
}

export function SectionTitle({ id, eyebrow, title, desc, right }: {
  id?: string; eyebrow: string; title: string; desc?: string; right?: ReactNode;
}) {
  return <div id={id} className="mb-4 flex scroll-mt-36 flex-wrap items-end justify-between gap-3 border-b border-[#bfc3b5] pb-3">
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.2em] text-[#617c25]">
        <span className="inline-block h-2 w-2 bg-[#c7f36b] ring-1 ring-[#111310]" />{eyebrow}
      </div>
      <h2 className="text-[clamp(22px,2.2vw,34px)] font-black leading-[1.02] tracking-[-.045em] text-[#111310]">{title}</h2>
      {desc && <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500">{desc}</p>}
    </div>{right}
  </div>;
}

export function Badge({ children, tone = "slate" }: {
  children: ReactNode; tone?: "slate" | "green" | "red" | "amber" | "blue";
}) {
  const t = {
    slate: "bg-[#eceee6] text-[#4c5147] ring-[#c9cdc0]", green: "bg-[#e6f2df] text-[#2f622c] ring-[#b6d0aa]",
    red: "bg-[#fff0eb] text-[#a83215] ring-[#f2b7a5]", amber: "bg-[#fff6d9] text-[#765b08] ring-[#e7d185]",
    blue: "bg-[#eef6d9] text-[#455c18] ring-[#cbdc9e]",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.04em] ring-1 ring-inset", t)}>{children}</span>;
}

export function ActionButton({ children, className, variant = "light", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode; variant?: "light" | "primary" | "dark" | "danger";
}) {
  return <button type="button" className={cn("btn", variant === "primary" && "btn-primary", variant === "dark" && "btn-dark", variant === "danger" && "btn-danger", className)} {...props}>{children}</button>;
}
