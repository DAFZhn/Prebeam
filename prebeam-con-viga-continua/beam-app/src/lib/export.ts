import type { Result } from "./calc";

export function exportCsv(res: Result, name = "cortante_vertical") {
  const head = [
    "x (ft)",
    "V (kip)",
    "V camion (kip)",
    "Vu (kip)",
    "M (kip-ft)",
    "M camion (kip-ft)",
    "Mu (kip-ft)",
    "Vu*d/Mu",
    "phiVc calc (kip)",
    "phiVc util (kip)",
    "phiVc min (kip)",
    "phiVc max (kip)",
    "phiVs (kip)",
    "S teorico (in)",
    "S max (in)",
    "S req (in)",
    "S real (in)",
    "phiVn prov (kip)",
    "D/C",
    "Estado",
  ];
  const f = (n: number) => n.toFixed(3);
  const lines = res.rows.map((r) =>
    [
      f(r.x),
      f(r.V),
      f(r.Vt),
      f(r.Vu),
      f(r.M),
      f(r.Mt),
      f(r.Mu),
      f(r.ratio),
      f(r.phiVcCalc),
      f(r.phiVcUtil),
      f(r.phiVcMin),
      f(r.phiVcMax),
      f(r.phiVs),
      f(r.sTheo),
      f(r.sMax),
      f(r.sReq),
      f(r.sReal),
      f(r.phiVnProv),
      f(r.dc),
      r.status,
    ].join(",")
  );
  const blob = new Blob(["\ufeff" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
