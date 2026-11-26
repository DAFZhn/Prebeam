import type { ReactNode } from "react";

export interface NavItem {
  id: string;
  label: string;
}

interface Props {
  /** enlaces de la barra de secciones */
  nav: NavItem[];
  /** botones a la derecha de la barra (exportar, imprimir, ejemplos…) */
  actions?: ReactNode;
  /** insignias bajo la barra (norma, unidades…) */
  badges?: ReactNode;
  /** cajetín que sólo aparece al imprimir */
  printHeader?: ReactNode;
  /** panel lateral de datos de entrada */
  aside: ReactNode;
  /** contenido principal (secciones con id = nav[i].id) */
  children: ReactNode;
}

/**
 * Estructura común de todas las herramientas: barra de secciones, panel de datos
 * a la izquierda y resultados a la derecha. Una herramienta nueva sólo aporta
 * su panel de entrada y sus secciones.
 */
export default function ToolFrame({ nav, actions, badges, printHeader, aside, children }: Props) {
  return (
    <>
      <nav className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1700px] items-center gap-1 overflow-x-auto px-4 py-2">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {n.label}
            </a>
          ))}
          {actions && <div className="ml-auto flex items-center gap-2 pl-4">{actions}</div>}
        </div>
        {badges && (
          <div className="mx-auto flex max-w-[1700px] flex-wrap gap-2 border-t border-slate-100 px-4 py-1.5 text-[11px] font-semibold text-slate-600">
            {badges}
          </div>
        )}
      </nav>

      {printHeader}

      <main className="mx-auto grid max-w-[1700px] gap-5 px-4 py-6 lg:grid-cols-[370px_minmax(0,1fr)]">
        <aside className="no-print scroll-thin lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-112px)] lg:self-start lg:overflow-y-auto lg:rounded-2xl">
          {aside}
        </aside>
        <div className="min-w-0 space-y-10">{children}</div>
      </main>
    </>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 ring-1 ring-slate-200">{children}</span>;
}
