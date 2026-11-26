import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { findTool, TOOLS } from "./tools/registry";

const TOOL_KEY = "prebeam-tool";

function Logo() {
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden>
      <rect width="48" height="48" rx="11" fill="#f59e0b" />
      <rect x="6" y="15" width="36" height="18" rx="2" fill="#0b1f3a" />
      <path d="M12 15v18M18 15v18M24 15v18M30 15v18M36 15v18" stroke="#38bdf8" strokeWidth="2" />
      <path d="M6 28h36" stroke="#f59e0b" strokeWidth="2.5" />
      <path d="M6 38l5-3h26l5 3" stroke="#0b1f3a" strokeWidth="2" fill="none" />
    </svg>
  );
}

function loadToolId(): string {
  try {
    return findTool(localStorage.getItem(TOOL_KEY)).id;
  } catch {
    return TOOLS[0].id;
  }
}

export default function App() {
  const [toolId, setToolId] = useState<string>(loadToolId);
  const tool = findTool(toolId);
  const Tool = tool.Component;

  useEffect(() => {
    try {
      localStorage.setItem(TOOL_KEY, tool.id);
    } catch {
      /* ignore */
    }
    document.title = `PreBeam · ${tool.title}`;
  }, [tool]);

  // el menú agrupa las herramientas si alguna declara «group»
  const groups = Array.from(new Set(TOOLS.map((t) => t.group ?? "")));

  return (
    <div className="min-h-screen">
      <header className="blueprint no-print relative overflow-hidden text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-[1700px] flex-wrap items-center gap-5 px-5 py-6">
          <Logo />
          <div className="min-w-0 flex-1 basis-80">
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              Pre<span className="text-amber-400">Beam</span>
              <span className="ml-2 text-lg font-semibold text-slate-300 md:text-xl">· {tool.title}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-300">{tool.summary}</p>
          </div>

          <label className="block w-full max-w-md shrink-0 sm:w-auto sm:min-w-[340px]">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
              <Wrench className="h-3.5 w-3.5" /> Herramienta
            </span>
            <select
              value={tool.id}
              onChange={(e) => {
                setToolId(e.target.value);
                window.scrollTo({ top: 0 });
              }}
              className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm font-semibold text-white outline-none ring-1 ring-white/30 transition hover:bg-white/15 focus:ring-2 focus:ring-amber-400"
            >
              {groups.map((g) => {
                const items = TOOLS.filter((t) => (t.group ?? "") === g);
                const opts = items.map((t) => (
                  <option key={t.id} value={t.id} className="text-slate-900">
                    {t.label}
                  </option>
                ));
                return g ? (
                  <optgroup key={g} label={g} className="text-slate-900">
                    {opts}
                  </optgroup>
                ) : (
                  opts
                );
              })}
            </select>
          </label>
        </div>
      </header>

      {/* key: al cambiar de herramienta se reinicia su estado de interfaz */}
      <Tool key={tool.id} />

      <footer className="no-print pb-6 text-center text-xs text-slate-400">
        PreBeam · Herramientas para vigas pretensadas · Referencia: ACI 318-19 «Building Code Requirements for Structural Concrete»
      </footer>
    </div>
  );
}
