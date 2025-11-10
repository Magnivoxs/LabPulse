export const pct2 = (n: number, d: number) =>
  Number(((n / Math.max(1, d)) * 100).toFixed(2));

