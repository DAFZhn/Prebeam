import type { ToolDef } from "../types";
import ShearTool from "./ShearTool";

export const shearTool: ToolDef = {
  id: "shear-simple",
  label: "Cortante vertical · viga simplemente apoyada",
  group: "Vigas pretensadas",
  title: "Cortante vertical en vigas pretensadas",
  summary: "Verificación y diseño de estribos según ACI 318-19 · método simplificado de Vc · tabla por secciones, gráficas y memoria de cálculo.",
  Component: ShearTool,
};
