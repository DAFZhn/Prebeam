import type { ToolDef } from "./types";
import { shearTool } from "./shear";
import { continuousTool } from "./continuous";

/** Lista de herramientas disponibles en el menú. El orden es el del menú. */
export const TOOLS: ToolDef[] = [shearTool, continuousTool];

export const DEFAULT_TOOL_ID = TOOLS[0].id;

export function findTool(id: string | null | undefined): ToolDef {
  return TOOLS.find((t) => t.id === id) ?? TOOLS[0];
}
