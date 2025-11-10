export async function parseCsv(text: string): Promise<{ headers: string[]; rows: any[] }> {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h=>h.trim());
  const rows = lines.slice(1).map(l => {
    const cells = l.split(",").map(c => c.trim());
    return Object.fromEntries(headers.map((h,i)=>[h, cells[i] ?? ""]));
  });
  return { headers, rows };
}

