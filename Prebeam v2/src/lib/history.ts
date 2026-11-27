import { useCallback, useEffect, useReducer } from "react";

/**
 * Historial de cambios (deshacer / rehacer) para el estado de una herramienta.
 *
 * - Las ediciones de un mismo campo hechas en menos de 0.9 s se agrupan en un solo paso
 *   (escribir «12.5» cuenta como un cambio, no como cuatro).
 * - Agregar o quitar tramos, activar interruptores, cargar un ejemplo o restablecer
 *   siempre crean un paso propio.
 * - Opcionalmente guarda el estado actual en localStorage (autoguardado).
 * - Instala Ctrl/Cmd+Z (deshacer) y Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y (rehacer).
 */

export const COALESCE_MS = 900;
export const HISTORY_LIMIT = 200;

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
  /** clave del grupo de edición en curso (null = el siguiente cambio abre un paso nuevo) */
  lastKey: string | null;
  lastAt: number;
}

export type HistoryAction<T> =
  | { type: "set"; patch: Partial<T>; now: number; limit?: number }
  | { type: "replace"; next: T; limit?: number }
  | { type: "undo" }
  | { type: "redo" };

export function createHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [], lastKey: null, lastAt: 0 };
}

/** ¿El parche es una edición de valores (números, textos o elementos de una lista del mismo largo)? */
function isValueEdit<T extends object>(cur: T, patch: Partial<T>): boolean {
  return (Object.keys(patch) as (keyof T)[]).every((k) => {
    const a = cur[k] as unknown;
    const b = patch[k] as unknown;
    if (typeof b === "number" || typeof b === "string") return typeof a === typeof b;
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length;
    return false;
  });
}

export const sameData = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export function historyReducer<T extends object>(s: HistoryState<T>, a: HistoryAction<T>): HistoryState<T> {
  switch (a.type) {
    case "set": {
      const keys = Object.keys(a.patch) as (keyof T)[];
      if (keys.every((k) => Object.is(s.present[k], a.patch[k]))) return s; // nada cambió
      const present = { ...s.present, ...a.patch };
      const edit = isValueEdit(s.present, a.patch);
      const key = keys.map(String).sort().join("|");
      if (edit && s.lastKey === key && a.now - s.lastAt < COALESCE_MS) {
        return { ...s, present, future: [], lastAt: a.now };
      }
      return {
        past: [...s.past, s.present].slice(-(a.limit ?? HISTORY_LIMIT)),
        present,
        future: [],
        lastKey: edit ? key : null,
        lastAt: a.now,
      };
    }
    case "replace": {
      if (sameData(s.present, a.next)) return s;
      return { past: [...s.past, s.present].slice(-(a.limit ?? HISTORY_LIMIT)), present: a.next, future: [], lastKey: null, lastAt: 0 };
    }
    case "undo": {
      if (!s.past.length) return s;
      const present = s.past[s.past.length - 1];
      return { past: s.past.slice(0, -1), present, future: [s.present, ...s.future], lastKey: null, lastAt: 0 };
    }
    case "redo": {
      if (!s.future.length) return s;
      const [present, ...future] = s.future;
      return { past: [...s.past, s.present], present, future, lastKey: null, lastAt: 0 };
    }
  }
}

/** Combina datos guardados con los valores por defecto, descartando lo que no tenga el tipo esperado */
export function reviveInto<T extends object>(raw: unknown, defaults: T): T | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(defaults) as (keyof T & string)[]) {
    const d = defaults[k] as unknown;
    const v = src[k];
    const ok =
      v !== undefined &&
      (Array.isArray(d) ? Array.isArray(v) : typeof v === typeof d && (typeof v !== "number" || isFinite(v)) && v !== null);
    out[k] = ok ? v : d;
  }
  return out as T;
}

export interface UseHistoryOptions<T> {
  /** clave de localStorage para el autoguardado (sin clave no se guarda nada) */
  storageKey?: string;
  /** valida y completa los datos leídos de localStorage; devuelve null para descartarlos */
  revive?: (raw: unknown) => T | null;
  limit?: number;
}

export interface HistoryApi<T> {
  state: T;
  /** modifica parte del estado (agrupa ediciones consecutivas del mismo campo) */
  set: (patch: Partial<T>) => void;
  /** sustituye todo el estado como un paso nuevo (ejemplo, restablecer…) */
  replace: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function loadSaved<T>(o: UseHistoryOptions<T>): T | null {
  if (!o.storageKey) return null;
  try {
    const raw = localStorage.getItem(o.storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return o.revive ? o.revive(parsed) : (parsed as T);
  } catch {
    return null;
  }
}

export function useHistory<T extends object>(init: () => T, opts: UseHistoryOptions<T> = {}): HistoryApi<T> {
  const limit = opts.limit ?? HISTORY_LIMIT;
  const reducer = historyReducer as (s: HistoryState<T>, a: HistoryAction<T>) => HistoryState<T>;
  const [s, dispatch] = useReducer(reducer, null, () => createHistory<T>(loadSaved(opts) ?? init()));

  const set = useCallback((patch: Partial<T>) => dispatch({ type: "set", patch, now: Date.now(), limit }), [limit]);
  const replace = useCallback((next: T) => dispatch({ type: "replace", next, limit }), [limit]);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  // autoguardado del estado actual (no del historial)
  useEffect(() => {
    if (!opts.storageKey) return;
    try {
      localStorage.setItem(opts.storageKey, JSON.stringify(s.present));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [s.present, opts.storageKey]);

  // atajos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return { state: s.present, set, replace, undo, redo, canUndo: s.past.length > 0, canRedo: s.future.length > 0 };
}
