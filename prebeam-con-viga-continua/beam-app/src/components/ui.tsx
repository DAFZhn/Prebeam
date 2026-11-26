import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

export function NumField({
  label,
  unit,
  value,
  onChange,
  hint,
  className,
}: {
  label: ReactNode;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  className?: string;
}) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => {
    if (parseFloat(txt) !== value) setTxt(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        {hint && <span className="font-normal normal-case tracking-normal text-slate-400">{hint}</span>}
      </span>
      <span className="group flex items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <input
          type="text"
          inputMode="decimal"
          value={txt}
          onChange={(e) => {
            const v = e.target.value.replace(",", ".");
            setTxt(v);
            const n = parseFloat(v);
            if (!isNaN(n)) onChange(n);
          }}
          onBlur={() => setTxt(String(value))}
          className="w-full min-w-0 bg-transparent px-2.5 py-1.5 font-mono text-sm text-slate-900 outline-none"
        />
        {unit && (
          <span className="flex items-center border-l border-slate-200 bg-slate-50 px-2 font-mono text-[11px] text-slate-500">
            {unit}
          </span>
        )}
      </span>
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-left transition hover:border-slate-300"
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition",
          checked ? "bg-blue-600" : "bg-slate-300"
        )}
      >
        <span className={cn("h-4 w-4 rounded-full bg-white shadow transition", checked && "translate-x-4")} />
      </span>
      <span>
        <span className="block text-[13px] font-semibold text-slate-800">{label}</span>
        {hint && <span className="block text-[11px] leading-snug text-slate-500">{hint}</span>}
      </span>
    </button>
  );
}

export function PanelGroup({
  title,
  icon,
  children,
  tone = "blue",
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  tone?: "blue" | "red" | "green" | "amber" | "slate";
}) {
  const bar = {
    blue: "bg-blue-600",
    red: "bg-rose-600",
    green: "bg-emerald-600",
    amber: "bg-amber-500",
    slate: "bg-slate-600",
  }[tone];
  return (
    <section className="border-b border-slate-200 px-4 py-4 last:border-0">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
        <span className={cn("h-4 w-1 rounded-full", bar)} />
        {icon}
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function SectionTitle({
  id,
  eyebrow,
  title,
  desc,
  right,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  desc?: string;
  right?: ReactNode;
}) {
  return (
    <div id={id} className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        {desc && <p className="mt-0.5 max-w-3xl text-sm text-slate-500">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "red" | "amber" | "blue";
}) {
  const t = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        t
      )}
    >
      {children}
    </span>
  );
}
