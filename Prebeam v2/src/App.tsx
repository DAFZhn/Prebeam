import { useEffect, useRef, useState } from "react";
import { ChevronDown, MoveDown } from "lucide-react";
import { findTool, TOOLS } from "./tools/registry";

const TOOL_KEY = "prebeam-tool";
function Logo() {
  return <svg viewBox="0 0 44 44" className="h-10 w-10" aria-hidden="true">
    <path d="M3 33 22 7l19 26H3Z" fill="#c7f36b" />
    <path d="m11 30 11-15 11 15H11Z" fill="#111310" />
    <path d="M3 36h38" stroke="#f7f7ef" strokeWidth="2" />
    <path d="M8 36v4m7-4v4m7-4v4m7-4v4m7-4v4" stroke="#c7f36b" strokeWidth="2" />
  </svg>;
}
function loadToolId(): string {
  try { return findTool(localStorage.getItem(TOOL_KEY)).id; } catch { return TOOLS[0].id; }
}

export default function App() {
  const [toolId, setToolId] = useState<string>(loadToolId);
  const heroRef = useRef<HTMLElement>(null);
  const tool = findTool(toolId);
  const Tool = tool.Component;
  useEffect(() => {
    try { localStorage.setItem(TOOL_KEY, tool.id); } catch { /* storage no disponible */ }
    document.title = `PreBeam · ${tool.title}`;
  }, [tool]);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, window.scrollY / 380);
      heroRef.current?.style.setProperty("--hero-progress", String(p));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const groups = Array.from(new Set(TOOLS.map((t) => t.group ?? "")));

  return <div className="min-h-screen">
    <header ref={heroRef} className="app-hero no-print">
      <div className="relative z-10 mx-auto max-w-[1800px] px-5 py-5 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-4">
          <div className="flex items-center gap-3"><Logo />
            <div><div className="text-sm font-black tracking-[-.03em]">PREBEAM<sup className="ml-1 text-[8px]">®</sup></div>
              <div className="font-mono text-[8px] uppercase tracking-[.18em] text-white/55">Structural engineering tools</div></div>
          </div>
          <div className="flex items-center gap-5 font-mono text-[9px] uppercase tracking-[.12em] text-white/65">
            <span className="hidden sm:inline">ACI 318</span><span className="hidden md:inline">Kip · Ft · In</span>
            <span className="flex items-center gap-2 text-[#c7f36b]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c7f36b]" />Motor activo</span>
          </div>
        </div>
        <div className="grid items-end gap-7 pb-7 pt-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:pb-9 lg:pt-8">
          <div className="hero-word">
            <div className="hero-enter mb-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#c7f36b]">
              <span className="h-px w-8 bg-[#c7f36b]" />Cálculo estructural / 2026
            </div>
            <h1 className="hero-enter max-w-5xl text-[clamp(47px,6.4vw,102px)] font-black uppercase leading-[.82] tracking-[-.075em] text-[#f7f7ef]">
              PRE<span className="text-[#c7f36b]">BEAM</span>
            </h1>
            <div className="hero-enter-delay mt-5 max-w-3xl">
              <p className="text-base font-bold tracking-[-.025em] text-white sm:text-lg">{tool.title}</p>
              <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-white/55 sm:text-xs">{tool.summary}</p>
            </div>
          </div>
          <div className="hero-enter-delay relative z-20 lg:justify-self-end w-full">
            <label className="block rounded-xl border border-white/25 bg-[#111310]/90 p-3 shadow-[5px_5px_0_rgba(199,243,107,.9)] backdrop-blur">
              <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[.14em] text-white/55">Seleccionar herramienta</span>
              <span className="relative block">
                <select value={tool.id} onChange={(e) => { setToolId(e.target.value); window.scrollTo({ top: 0 }); }}
                  className="w-full appearance-none rounded-lg border border-white/20 bg-[#252920] px-3 py-3 pr-9 text-xs font-bold text-white outline-none transition focus:border-[#c7f36b]">
                  {groups.map((g) => {
                    const opts = TOOLS.filter((t) => (t.group ?? "") === g).map((t) => <option key={t.id} value={t.id}>{t.label}</option>);
                    return g ? <optgroup key={g} label={g}>{opts}</optgroup> : opts;
                  })}
                </select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#c7f36b]" />
              </span>
            </label>
          </div>
        </div>
      </div>
      <svg className="hero-beam pointer-events-none absolute bottom-[16%] right-[4%] z-[1] hidden w-[38vw] opacity-90 lg:block" viewBox="0 0 600 180" aria-hidden="true">
        <path d="M20 120h560" stroke="#111310" strokeWidth="14" />
        <path className="beam-flow" d="M20 120h560" stroke="#f7f7ef" strokeWidth="2" strokeDasharray="18 16" />
        {[70,180,290,400,510].map((x) => <g key={x}><path d={`M${x} 120v45`} stroke="#111310" strokeWidth="5" /><path d={`m${x-20} 165 20 12 20-12`} fill="none" stroke="#111310" strokeWidth="4" /></g>)}
        <path d="m25 90 80-55m40 55 80-55m40 55 80-55m40 55 80-55" stroke="#111310" strokeWidth="3" />
      </svg>
      <div className="absolute bottom-3 left-5 z-10 hidden items-center gap-2 font-mono text-[8px] uppercase tracking-[.15em] text-white/40 lg:flex"><MoveDown className="h-3 w-3" />Desplaza para calcular</div>
    </header>
    <Tool key={tool.id} />
    <footer className="no-print border-t border-[#c8cbbf] bg-[#e8eae1] px-5 py-7">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-end justify-between gap-4">
        <div><div className="text-sm font-black tracking-[-.03em]">PREBEAM®</div>
          <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-slate-500">Herramientas de apoyo para vigas pretensadas. Los resultados deben ser revisados por el ingeniero responsable.</p></div>
        <p className="font-mono text-[9px] uppercase tracking-[.08em] text-slate-500">Referencia · ACI 318-19 Building Code Requirements for Structural Concrete</p>
      </div>
    </footer>
  </div>;
}
