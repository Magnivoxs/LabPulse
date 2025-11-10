import * as XLSX from "xlsx";

export function parseXlsx(file: File): Promise<{ headers: string[]; rows: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const wb = XLSX.read(reader.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
        const [headers, ...body] = json as any[][];
        const rows = body.map(r => Object.fromEntries((headers as string[]).map((h,i)=>[String(h).trim(), r[i]])));
        resolve({ headers: (headers as string[]).map(h=>String(h).trim()), rows });
      } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

