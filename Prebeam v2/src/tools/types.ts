import type { ComponentType } from "react";
export interface ToolDef {
  id: string; label: string; group?: string; title: string; summary: string; Component: ComponentType;
}
