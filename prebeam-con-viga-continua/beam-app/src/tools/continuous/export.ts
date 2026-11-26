import type { ContinuousResult } from "./engine";

export function exportContinuousCsv(res: ContinuousResult, name = "viga_continua") {
  const head = [
    "Tramo",
    "x (ft)",
    "X global (ft)",
    "x cortante diseno (ft)",
    "Vu (kip)",
    "Mu concurrente (kip-ft)",
    "Vu*d/Mu",
    "phiVc util (kip)",
    "phiVs (kip)",
    "S teorico (in)",
    "S max (in)",
    "S real (in)",
    "D/C cortante",
    "Estado cortante",
    "Mu+ (kip-ft)",
    "Mu- (kip-ft)",
    "D/C flexion +",
    "D/C flexion -",
    "Estado flexion",
  ];
  const f = (n: number) => (isFinite(n) ? n.toFixed(3) : "inf");
  const lines = res.rows.map((r) =>
    [
      r.span + 1,
      f(r.x),
      f(r.X),
      f(r.xEval),
      f(Math.abs(r.Vu)),
      f(r.Mc),
      f(r.shear.ratio),
      f(r.shear.phiVcUtil),
      f(r.shear.phiVs),
      f(r.shear.sTheo),
      f(r.shear.sMax),
      f(r.shear.sReal),
      f(r.shear.dc),
      r.shear.status,
      f(r.MuPos),
      f(r.MuNeg),
      f(r.dcPos),
      f(r.dcNeg),
      r.flexStatus,
    ].join(",")
  );
  const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
