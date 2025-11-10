import { useMemo } from "react";
import { pct2 } from "@/lib/derive";
import { exportToCsv } from "@/lib/export";

function prevYearPeriod(p: string) {
  const y = Number(p.slice(0,4)); const m = p.slice(5,7);
  return `${y-1}-${m}`;
}

export default function OfficeCompare({ offices, monthly }:{
  offices:any[]; monthly:any[];
}) {
  const latestMap = useMemo(()=>{
    const map = new Map<number, any>();
    monthly.forEach((m:any)=>{
      const cur = map.get(m.officeId);
      if (!cur || m.period > cur.period) map.set(m.officeId, m);
    });
    return map;
  }, [monthly]);

  const byOffice = useMemo(()=>{
    const m = new Map<number, any[]>();
    monthly.forEach((r:any)=>{
      const arr = m.get(r.officeId) ?? [];
      arr.push(r); m.set(r.officeId, arr);
    });
    for (const [,arr] of m) arr.sort((a,b)=>a.period.localeCompare(b.period));
    return m;
  }, [monthly]);

  function handleExport() {
    const headers = ["Office", "Revenue", "Lab % incl", "Lab % YoY", "Personnel %", "Personnel % YoY", "Units", "Patients", "Status"];
    const rows = offices.map((o:any) => {
      const r = latestMap.get(o.id);
      if (!r) return [`${o.id} · ${o.name}`, "No data", "", "", "", "", "", "", ""];
      const lab = pct2(r.labExpenses, r.revenue);
      const per = pct2(r.personnel, r.revenue);
      const series = byOffice.get(o.id) ?? [];
      const prev = series.find((x:any)=> x.period === prevYearPeriod(r.period));
      const labPrev = prev ? pct2(prev.labExpenses, prev.revenue) : null;
      const perPrev = prev ? pct2(prev.personnel, prev.revenue) : null;
      const labYoY = labPrev && labPrev !== 0 ? Number((((lab - labPrev)/labPrev)*100).toFixed(2)) : null;
      const perYoY = perPrev && perPrev !== 0 ? Number((((per - perPrev)/perPrev)*100).toFixed(2)) : null;
      const status = lab<=13 && per<=7 ? "On Goal" : lab>13 ? "High Lab %" : "High Personnel %";
      return [
        `${o.id} · ${o.name}, ${o.state}`,
        `$${r.revenue.toLocaleString()}`,
        `${lab}%`,
        labYoY==null ? "n/a" : (labYoY>0?"+":"")+labYoY+"%",
        `${per}%`,
        perYoY==null ? "n/a" : (perYoY>0?"+":"")+perYoY+"%",
        String(r.units),
        String(r.patients),
        status
      ];
    });
    exportToCsv(headers, rows, "office_compare.csv");
  }

  return (
    <div style={{overflowX:"auto"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
        <span></span>
        <button onClick={handleExport} style={{padding:"6px 12px", fontSize:12}}>Export CSV</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Office</th>
            <th>Revenue</th>
            <th>Lab % incl</th>
            <th>Lab % YoY</th>
            <th>Personnel %</th>
            <th>Personnel % YoY</th>
            <th>Units</th>
            <th>Patients</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {offices.map((o:any)=>{
            const r = latestMap.get(o.id);
            if (!r) return <tr key={o.id}><td>{o.id} · {o.name}</td><td colSpan={8}>No data</td></tr>;

            const lab = pct2(r.labExpenses, r.revenue);
            const per = pct2(r.personnel, r.revenue);
            // YoY vs same month last year
            const series = byOffice.get(o.id) ?? [];
            const prev = series.find((x:any)=> x.period === prevYearPeriod(r.period));
            const labPrev = prev ? pct2(prev.labExpenses, prev.revenue) : null;
            const perPrev = prev ? pct2(prev.personnel, prev.revenue) : null;
            const labYoY = labPrev && labPrev !== 0 ? Number((((lab - labPrev)/labPrev)*100).toFixed(2)) : null;
            const perYoY = perPrev && perPrev !== 0 ? Number((((per - perPrev)/perPrev)*100).toFixed(2)) : null;

            const status = lab<=13 && per<=7 ? "On Goal" : lab>13 ? "High Lab %" : "High Personnel %";

            return (
              <tr key={o.id}>
                <td>{o.id} · {o.name}, {o.state}</td>
                <td>${r.revenue.toLocaleString()}</td>
                <td style={{color: lab<=13?"#059669":"#dc2626"}}>{lab}%</td>
                <td style={{color: labYoY==null ? "#6b7280" : (labYoY<=0 ? "#059669" : "#dc2626")}}>
                  {labYoY==null ? "n/a" : (labYoY>0?"+":"")+labYoY+"%"}
                </td>
                <td style={{color: per<=7?"#059669":"#dc2626"}}>{per}%</td>
                <td style={{color: perYoY==null ? "#6b7280" : (perYoY<=0 ? "#059669" : "#dc2626")}}>
                  {perYoY==null ? "n/a" : (perYoY>0?"+":"")+perYoY+"%"}
                </td>
                <td>{r.units}</td>
                <td>{r.patients}</td>
                <td>{status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
