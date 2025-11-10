import { pct2 } from "./derive";

export function toRows(monthly: any[]) {
  return monthly.map(r => ({
    label: r.period?.slice(5) + "/" + r.period?.slice(2,4), // MM/YY
    rev: r.revenue,
    labPctIncl: pct2(r.labExpenses, r.revenue),
    labPctExcl: pct2(Math.max(0, r.labExpenses - r.outsideLab), r.revenue),
    teethPct: pct2(r.teethSupplies, r.revenue),
    suppliesPct: pct2(r.labSupplies, r.revenue),
    personnelPct: pct2(r.personnel, r.revenue),
    otPct: pct2(r.overtime, r.revenue),
    units: r.units, pts: r.patients, period: r.period, officeId: r.officeId
  }));
}

