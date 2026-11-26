import type { ComponentType } from "react";

/**
 * Definición de una herramienta de PreBeam. Para agregar una herramienta nueva:
 *  1. crea una carpeta en src/tools/<id>/ con su componente (usa <ToolFrame> para el layout),
 *  2. expórtala como un ToolDef (ver src/tools/shear/index.ts),
 *  3. añádela a la lista de src/tools/registry.ts.
 * El menú desplegable del encabezado se genera solo a partir del registro.
 */
export interface ToolDef {
  /** identificador estable (se guarda como selección del usuario) */
  id: string;
  /** texto en el menú desplegable */
  label: string;
  /** agrupa opciones en el menú (opcional) */
  group?: string;
  /** título que aparece en el encabezado junto a «PreBeam» */
  title: string;
  /** descripción corta bajo el título */
  summary: string;
  /** la herramienta completa: panel de datos + resultados */
  Component: ComponentType;
}
