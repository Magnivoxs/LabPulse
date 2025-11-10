import { useEffect, useState } from "react";
import { getStorage } from "@/storage";
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

  return (
    <div style={{display:"grid", gap:12}}>
      <div style={{display:"flex", gap:8}}>
        {["Monthly","Offices","Staff"].map(t=>(
          <button key={t} onClick={()=>setTab(t as any)}
            style={{padding:"6px 10px", background: tab===t?"#eef":"#f6f6f6", border:"1px solid #ddd"}}>
            {t}
          </button>
        ))}
      </div>

      {tab==="Offices" && <OfficeGrid rows={data.offices} onChange={(rows)=>save({ offices: rows })} />}
      {tab==="Staff"   && <StaffGrid   rows={data.staff}   offices={data.offices} onChange={(rows)=>save({ staff: rows })} />}
      {tab==="Monthly" && <MonthlyGrid rows={data.monthly} offices={data.offices} onChange={(rows)=>save({ monthly: rows })} />}
    </div>
  );
}

