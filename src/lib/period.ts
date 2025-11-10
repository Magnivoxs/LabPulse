export const isYYYYMM = (s: string) => /^\d{4}-\d{2}$/.test(s);

export function addMonth(yyyyMm: string): string {
  if (!isYYYYMM(yyyyMm)) return yyyyMm;
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

