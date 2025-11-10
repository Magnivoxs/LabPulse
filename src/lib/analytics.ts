// Lightweight analytics helpers for YoY and rolling averages
import { pct2 } from "./derive";

export type MonthlyRow = {
  officeId: number;
  period: string; // YYYY-MM
  revenue: number;
  labExpenses: number;
  outsideLab: number;
  teethSupplies: number;
  labSupplies: number;
  personnel: number;
  overtime: number;
  bonuses: number;
  units: number;
  patients: number;
};

export function groupByOffice(rows: MonthlyRow[]) {
  const map = new Map<number, MonthlyRow[]>();
  for (const r of rows) {
    const arr = map.get(r.officeId) ?? [];
    arr.push(r);
    map.set(r.officeId, arr);
  }
  // sort by period ascending
  for (const [, arr] of map) arr.sort((a, b) => a.period.localeCompare(b.period));
  return map;
}

export function labPctIncl(r: MonthlyRow) {
  return pct2(r.labExpenses, r.revenue);
}
export function labPctExcl(r: MonthlyRow) {
  return pct2(Math.max(0, r.labExpenses - r.outsideLab), r.revenue);
}
export function personnelPct(r: MonthlyRow) {
  return pct2(r.personnel, r.revenue);
}

function prevYearPeriod(p: string) {
  // p = "YYYY-MM"
  const y = Number(p.slice(0, 4));
  const m = p.slice(5, 7);
  return `${y - 1}-${m}`;
}

type YoYPoint = { period: string; value: number; yoyPct: number | null };

/**
 * Compute YoY for a numeric accessor over a single-office, period-sorted series.
 * Returns an array aligned to input periods with yoyPct null if no prev-year.
 */
export function yoy<T extends MonthlyRow>(
  series: T[],
  accessor: (r: T) => number
): YoYPoint[] {
  const byPeriod = new Map(series.map((r) => [r.period, accessor(r)]));
  return series.map((r) => {
    const cur = accessor(r);
    const prev = byPeriod.get(prevYearPeriod(r.period));
    const yoyPct = prev && prev !== 0 ? Number((((cur - prev) / prev) * 100).toFixed(2)) : null;
    return { period: r.period, value: cur, yoyPct };
  });
}

/**
 * Rolling average over a numeric accessor.
 * Returns an array aligned to input periods with null until window is full.
 */
export function rolling<T extends MonthlyRow>(
  series: T[],
  accessor: (r: T) => number,
  k = 3
): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  const buf: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const v = accessor(series[i]);
    buf.push(v);
    sum += v;
    if (buf.length > k) sum -= buf.shift()!;
    out.push(buf.length === k ? Number((sum / k).toFixed(2)) : null);
  }
  return out;
}

/** Convenience: enrich a single-office series with derived metrics for charts */
export function enrichForCharts<T extends MonthlyRow>(series: T[]) {
  const labYoy = yoy(series, labPctIncl);
  const perYoy = yoy(series, personnelPct);
  const labRoll = rolling(series, labPctIncl, 3);

  return series.map((r, i) => ({
    officeId: r.officeId,
    period: r.period,
    label: r.period.slice(5) + "/" + r.period.slice(2, 4), // MM/YY
    rev: r.revenue,
    units: r.units,
    pts: r.patients,
    labPctIncl: labPctIncl(r),
    labPctExcl: labPctExcl(r),
    teethPct: pct2(r.teethSupplies, r.revenue),
    suppliesPct: pct2(r.labSupplies, r.revenue),
    personnelPct: personnelPct(r),
    otPct: pct2(r.overtime, r.revenue),
    labPctInclRolling: labRoll[i],
    labPctInclYoY: labYoy[i].yoyPct,
    personnelPctYoY: perYoy[i].yoyPct,
  }));
}

/** Latest YoY for an office series; returns { labYoY, personnelYoY } */
export function latestYoY<T extends MonthlyRow>(series: T[]) {
  if (!series.length) return { labYoY: null as number | null, personnelYoY: null as number | null };
  const lab = yoy(series, labPctIncl).at(-1)?.yoyPct ?? null;
  const per = yoy(series, personnelPct).at(-1)?.yoyPct ?? null;
  return { labYoY: lab, personnelYoY: per };
}

