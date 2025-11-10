export function exportToCsv(headers: string[], rows: any[][], filename: string) {
  const lines = [
    headers.join(","),
    ...rows.map(r => r.map(cell => {
      const str = String(cell ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n") 
        ? `"${str.replace(/"/g, '""')}"` 
        : str;
    }).join(","))
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export function downloadTemplate(headers: string[], filename: string) {
  const blob = new Blob([headers.join(",") + "\n"], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

