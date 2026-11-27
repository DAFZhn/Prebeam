import { Download, FileSpreadsheet, Lightbulb, Printer, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { ActionButton } from "./ui";

interface Props {
  history: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean };
  /** carga un ejemplo de referencia */
  onExample?: () => void;
  /** pone todos los datos en blanco / cero */
  onReset: () => void;
  onExcel?: () => void;
  onCsv?: () => void;
  /** impide exportar mientras los datos no permitan calcular */
  exportDisabled?: boolean;
  /** texto de ayuda cuando exportar está desactivado */
  exportHint?: string;
  resetLabel?: string;
}

/**
 * Barra de acciones común a todas las herramientas: historial, ejemplo, exportar y restablecer.
 * Una herramienta nueva solo pasa sus funciones; el aspecto y los atajos ya están resueltos.
 */
export default function ToolActions({ history, onExample, onReset, onExcel, onCsv, exportDisabled, exportHint, resetLabel }: Props) {
  const why = exportDisabled ? (exportHint ?? "Completa los datos de entrada para poder exportar") : undefined;
  return (
    <>
      <div className="flex items-center gap-0.5 rounded-[7px] border border-[#afb3a6] bg-[#fffffc] p-0.5" role="group" aria-label="Historial de cambios">
        <button type="button" className="icon-btn" onClick={history.undo} disabled={!history.canUndo} aria-label="Deshacer" title="Deshacer (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" className="icon-btn" onClick={history.redo} disabled={!history.canRedo} aria-label="Rehacer" title="Rehacer (Ctrl+Shift+Z o Ctrl+Y)">
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
      {onExample && (
        <ActionButton onClick={onExample} title="Cargar un ejemplo de referencia (se puede deshacer)">
          <Lightbulb className="h-3.5 w-3.5" />
          <span className="hidden 2xl:inline">Ejemplo</span>
        </ActionButton>
      )}
      {onExcel && (
        <ActionButton variant="dark" onClick={onExcel} disabled={exportDisabled} title={why ?? "Exportar un archivo de Excel (.xlsx) para enviarlo a otra persona"} aria-label="Exportar a Excel">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Excel</span>
        </ActionButton>
      )}
      {onCsv && (
        <ActionButton onClick={onCsv} disabled={exportDisabled} title={why ?? "Exportar la tabla de diseño como CSV"}>
          <Download className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">CSV</span>
        </ActionButton>
      )}
      <ActionButton onClick={() => window.print()} title="Imprimir o guardar como PDF" aria-label="Imprimir memoria de cálculo">
        <Printer className="h-3.5 w-3.5" />
        <span className="hidden 2xl:inline">Imprimir</span>
      </ActionButton>
      <ActionButton variant="primary" onClick={onReset} title="Poner todos los datos en 0 para empezar de nuevo (se puede deshacer)" aria-label="Restablecer todos los datos a cero">
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{resetLabel ?? "Restablecer"}</span>
      </ActionButton>
    </>
  );
}
