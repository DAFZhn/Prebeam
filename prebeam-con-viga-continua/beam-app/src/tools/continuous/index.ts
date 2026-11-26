import type { ToolDef } from "../types";
import ContinuousTool from "./ContinuousTool";

export const continuousTool: ToolDef = {
  id: "continuous-beam",
  label: "Viga continua · análisis, cortante y flexión",
  group: "Vigas pretensadas",
  title: "Viga continua pretensada",
  summary: "Análisis por rigidez de vigas continuas (N tramos, empotramientos y voladizos) con envolvente de carga viva, estribos y flexión según ACI 318-19.",
  Component: ContinuousTool,
};
