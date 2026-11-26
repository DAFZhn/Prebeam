# Herramientas de PreBeam

El menú desplegable del encabezado se genera solo desde `registry.ts`.

## Agregar una herramienta nueva

1. Crea la carpeta `src/tools/<mi-herramienta>/` con un componente que use `<ToolFrame>`
   (`src/components/ToolFrame.tsx`): le pasas `nav`, `aside` (panel de datos), `actions`, `badges`
   y como hijos las secciones de resultados (cada una con `id` igual al de `nav`).
2. En `src/tools/<mi-herramienta>/index.ts` exporta un `ToolDef` (ver `shear/index.ts`):
   `id`, `label` (texto del menú), `group` (opcional), `title`, `summary` y `Component`.
3. Añádela a la lista `TOOLS` de `src/tools/registry.ts`.

Cada herramienta guarda sus datos en su propia clave de `localStorage`
(`prebeam-inputs-v1`, `prebeam-continuous-v1`, …) y la herramienta elegida se recuerda en `prebeam-tool`.

## Piezas reutilizables

- `lib/calc.ts`: `makeShearContext` + `designSection` verifican cortante en cualquier sección dado (Vu, Mu).
- `components/ui.tsx`: campos (`NumField`, `SelectField`, `TextField`, `Toggle`, `PanelGroup`…).
- `components/Kpis.tsx` (`Kpi`) y `components/ResultsTable.tsx` (`StatusBadge`).
