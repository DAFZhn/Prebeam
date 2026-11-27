import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

export interface NavItem { id: string; label: string }
interface Props {
  nav: NavItem[]; actions?: ReactNode; badges?: ReactNode; printHeader?: ReactNode; aside: ReactNode; children: ReactNode;
}

export default function ToolFrame({ nav, actions, badges, printHeader, aside, children }: Props) {
  const [active, setActive] = useState(nav[0]?.id ?? "");
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target.id) setActive(visible[0].target.id);
    }, { rootMargin: "-130px 0px -62% 0px", threshold: [0, .1] });
    nav.forEach((n) => { const el = document.getElementById(n.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [nav]);

  return <>
    <nav className="no-print sticky top-0 z-40 border-b border-[#111310] bg-[#fffffc]/95 backdrop-blur-xl" aria-label="Secciones de la herramienta">
      <div className="mx-auto flex max-w-[1800px] items-center gap-1 overflow-x-auto px-4 py-2.5 scroll-thin">
        <span className="mr-2 hidden font-mono text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400 xl:block">En esta herramienta</span>
        {nav.map((n, i) => <a key={n.id} href={`#${n.id}`} onClick={() => setActive(n.id)}
          className={cn("whitespace-nowrap rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[.04em] transition", active === n.id ? "bg-[#111310] text-[#c7f36b]" : "text-slate-500 hover:bg-[#eceee6] hover:text-[#111310]")}>
          <span className="mr-1.5 font-mono opacity-55">{String(i + 1).padStart(2, "0")}</span>{n.label}
        </a>)}
        {actions && <div className="ml-auto flex shrink-0 items-center gap-2 pl-4">{actions}</div>}
      </div>
      {badges && <div className="mx-auto flex max-w-[1800px] flex-wrap gap-2 border-t border-[#e2e4db] px-4 py-2">{badges}</div>}
    </nav>
    {printHeader}
    <main className="mx-auto grid max-w-[1800px] gap-6 px-4 py-7 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-6 lg:py-9">
      <aside className="no-print scroll-thin lg:sticky lg:top-[112px] lg:max-h-[calc(100vh-130px)] lg:self-start lg:overflow-y-auto lg:rounded-xl">{aside}</aside>
      <div className="min-w-0 space-y-12">{children}</div>
    </main>
  </>;
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[#d4d7cc] bg-[#f4f5ee] px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-wide text-slate-600">{children}</span>;
}
