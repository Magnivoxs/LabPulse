import { useEffect, useState } from "react";
import { getStorage } from "@/storage";
import { exportToCsv } from "@/lib/export";
import OfficeGrid from "./grids/OfficeGrid";
import StaffGrid from "./grids/StaffGrid";
import MonthlyGrid from "./grids/MonthlyGrid";

const storage = getStorage();

export default function EditPanel() {
  const [tab, setTab] = useState<"Offices"|"Staff"|"Monthly">("Monthly");
  const [data, setData] = useState<any>({ offices: [], staff: [], monthly: [] });

  async function reload() {
    setData(await storage.loadAll());
  }
  useEffect(() => { reload(); }, []);

  async function save(partial: Partial<typeof data>) {
    await storage.saveAll(partial as any);
    await reload();
  }

  function handleExport() {
    if (tab === "Offices") {
      const headers = ["id","name","state","address","phone","practiceModel","managingDentist","dfo","standardizationStatus","laborModel"];
      const rows = data.offices.map((o:any) => headers.map(h => o[h] ?? ""));
      exportToCsv(headers, rows, "offices.csv");
    } else if (tab === "Staff") {
      const headers = ["officeId","name","title","hireDate","phone"];
      const rows = data.staff.map((s:any) => headers.map(h => s[h] ?? ""));
      exportToCsv(headers, rows, "staff.csv");
    } else {
      const headers = ["officeId","period","revenue","labExpenses","outsideLab","teethSupplies","labSupplies","personnel","overtime","bonuses","units","patients"];
      const rows = data.monthly.map((m:any) => headers.map(h => m[h] ?? ""));
      exportToCsv(headers, rows, "monthly_metrics.csv");
    }
  }

  return (
    <div style={{display:"grid", gap:12}}>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        {["Monthly","Offices","Staff"].map(t=>(
          <button key={t} onClick={()=>setTab(t as any)}
            style={{padding:"6px 10px", background: tab===t?"#eef":"#f6f6f6", border:"1px solid #ddd"}}>
            {t}
          </button>
        ))}
        <div style={{marginLeft:"auto"}}>
          <button onClick={handleExport} style={{padding:"6px 12px", fontSize:12}}>Export CSV</button>
        </div>
      </div>

      {tab==="Offices" && <OfficeGrid rows={data.offices} onChange={(rows)=>save({ offices: rows })} />}
      {tab==="Staff"   && <StaffGrid   rows={data.staff}   offices={data.offices} onChange={(rows)=>save({ staff: rows })} />}
      {tab==="Monthly" && <MonthlyGrid rows={data.monthly} offices={data.offices} onChange={(rows)=>save({ monthly: rows })} />}
    </div>
  );
}

