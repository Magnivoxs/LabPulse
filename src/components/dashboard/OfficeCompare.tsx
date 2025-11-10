import { useMemo } from "react";
import { pct2 } from "@/lib/derive";
import { exportToCsv } from "@/lib/export";

export default function OfficeCompare({ offices, monthly }:{
  offices:any[]; monthly:any[];
}) {
  const lastByOffice = useMemo(()=>{
    const map = new Map<number, any>();
    monthly.forEach((m:any)=> {
      const cur = map.get(m.officeId);
      if (!cur || m.period > cur.period) map.set(m.officeId, m);
    });
    return map;
  }, [monthly]);

  function handleExport() {
    const headers = ["Office", "Revenue", "Lab % incl", "Personnel %", "Units", "Patients", "Status"];
    const rows = offices.map((o:any) => {
      const r = lastByOffice.get(o.id);
      if (!r) return [`${o.id} · ${o.name}`, "No data", "", "", "", "", ""];
      const lab = pct2(r.labExpenses, r.revenue);
      const per = pct2(r.personnel, r.revenue);
      const status = lab<=13 && per<=7 ? "On Goal" : lab>13 ? "High Lab %" : "High Personnel %";
      return [
        `${o.id} · ${o.name}, ${o.state}`,
        `$${r.revenue.toLocaleString()}`,
        `${lab}%`,
        `${per}%`,
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
          <tr><th>Office</th><th>Revenue</th><th>Lab % incl</th><th>Personnel %</th><th>Units</th><th>Patients</th><th>Status</th></tr>
        </thead>
        <tbody>
          {offices.map((o:any)=>{
            const r = lastByOffice.get(o.id);
            if (!r) return <tr key={o.id}><td>{o.id} · {o.name}</td><td colSpan={6}>No data</td></tr>;

            const lab = pct2(r.labExpenses, r.revenue);
            const per = pct2(r.personnel, r.revenue);
            const status = lab<=13 && per<=7 ? "On Goal" : lab>13 ? "High Lab %" : "High Personnel %";

            return (
              <tr key={o.id}>
                <td>{o.id} · {o.name}, {o.state}</td>
                <td>${r.revenue.toLocaleString()}</td>
                <td style={{color: lab<=13?"#059669":"#dc2626"}}>{lab}%</td>
                <td style={{color: per<=7?"#059669":"#dc2626"}}>{per}%</td>
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

