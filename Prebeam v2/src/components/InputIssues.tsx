import { AlertTriangle, Lightbulb } from "lucide-react";
import { ActionButton } from "./ui";

interface Props {
  errors: string[];
  /** true cuando todos los datos están en blanco (recién restablecido) */
  blank: boolean;
  onExample?: () => void;
}

/** Muestra qué falta para poder calcular: guía amable si está en blanco, aviso si hay datos inválidos */
export default function InputIssues({ errors, blank, onExample }: Props) {
  if (blank) {
    return (
      <div className="card border-dashed border-[#111310] bg-[#f7f9ee] p-5 lg:p-6" role="status">
        <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#617c25]">Hoja en blanco</p>
        <h2 className="mt-1 text-2xl font-black leading-tight tracking-[-.04em] text-[#111310]">Empieza ingresando tus datos</h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-600">
          Todas las variables están en 0. Completa el panel de la izquierda y los resultados aparecerán aquí en cuanto los datos permitan calcular.
          Tus cambios se guardan solos y puedes deshacerlos con Ctrl+Z.
        </p>
        {errors.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#111310]">Para calcular necesitas</p>
            <ul className="mt-2 grid list-disc gap-x-8 gap-y-1 pl-5 text-xs text-slate-600 md:grid-cols-2">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {onExample && (
          <ActionButton className="mt-5" variant="primary" onClick={onExample}>
            <Lightbulb className="h-3.5 w-3.5" />
            Cargar un ejemplo
          </ActionButton>
        )}
      </div>
    );
  }
  return (
    <div className="card flex gap-3 border-[#ff6038] bg-[#fff0eb] p-4 text-[#8e2a10]" role="alert">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide">Revisa los datos de entrada</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
