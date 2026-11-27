import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

export interface ToastAction { label: string; onClick: () => void }
export interface ToastOptions { action?: ToastAction; ms?: number }

/**
 * Avisos breves en la parte inferior. Uso:
 *   const toast = useToast();
 *   toast.show("Datos restablecidos", { action: { label: "Deshacer", onClick: undo } });
 *   return <>…{toast.node}</>;
 */
export function useToast() {
  const [toast, setToast] = useState<{ id: number; msg: string; action?: ToastAction } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((msg: string, o: ToastOptions = {}) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), msg, action: o.action });
    timer.current = window.setTimeout(() => setToast(null), o.ms ?? 6000);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const node = (
    <div className="toast-region no-print" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className="toast">
          <Check className="h-4 w-4 shrink-0 text-[#c7f36b]" aria-hidden="true" />
          <span>{toast.msg}</span>
          {toast.action && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.action?.onClick();
                hide();
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" className="toast-close" onClick={hide} aria-label="Cerrar aviso">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  return { show, hide, node };
}
