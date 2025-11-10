import { useMemo, useState } from "react";
import { normalizeOfficeId } from "@/lib/ids";
import { addMonth } from "@/lib/period";
import { pct2 } from "@/lib/derive";
import { toast } from "@/components/ui/Toast";

export default function MonthlyGrid({ rows, offices, onChange }:{
  rows:any[]; offices:any[]; onChange:(rows:any[])=>void;
}) {
  const [draft, setDraft] = useState<any[]>(rows);
  const officeIds = useMemo(()=>offices.map((o:any)=>o.id),[offices]);

  function update(i:number, k:string, v:any) {
    const next=[...draft];
    if (k==="officeId") v = normalizeOfficeId(v);
    next[i]={...next[i],[k]:typeof (next[i][k])==="number" ? Number(v) : v};
    setDraft(next);
  }
  function add() {
    setDraft([{ officeId: officeIds[0] ?? 0, period:"2025-01", revenue:0,
      labExpenses:0,outsideLab:0,teethSupplies:0,labSupplies:0,personnel:0,overtime:0,bonuses:0,units:0,patients:0 }, ...draft]);
  }
  function quickAddMonth(officeId:number) {
    const list = draft.filter(r=>r.officeId===officeId).sort((a,b)=>a.period.localeCompare(b.period));
    const last = list[list.length-1];
    if (!last) return;
    const copy = { ...last, period: addMonth(last.period) };
    setDraft([copy, ...draft]);
  }
  function del(i:number){ setDraft(draft.filter((_,idx)=>idx!==i)); }
  async function save(){ await onChange(draft); toast("Monthly metrics saved"); }

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <button onClick={add}>Add Row</button>
        <select onChange={e=>quickAddMonth(Number(e.target.value))} defaultValue="">
          <option value="">Quick Add Month…</option>
          {officeIds.map(id=><option key={id} value={id}>Office {id}</option>)}
        </select>
        <button onClick={save}>Save</button>
      </div>

      <table style={{width:"100%", fontSize:12}}>
        <thead><tr>
          {["officeId","period","revenue","labExpenses","outsideLab",
            "teethSupplies","labSupplies","personnel","overtime","bonuses",
            "units","patients",
            "lab% incl","teeth%","supplies%","personnel%","ot%",""
          ].map(h=><th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {draft.map((r,i)=>(
            <tr key={i}>
              {["officeId","period","revenue","labExpenses","outsideLab",
                "teethSupplies","labSupplies","personnel","overtime","bonuses",
                "units","patients"].map(k=>(
                <td key={k}><input
                  value={(r as any)[k]??""}
                  onChange={e=>update(i,k,e.target.value)}
                  style={{width:"100%"}}/></td>
              ))}
              <td>{pct2(r.labExpenses, r.revenue)}%</td>
              <td>{pct2(r.teethSupplies, r.revenue)}%</td>
              <td>{pct2(r.labSupplies, r.revenue)}%</td>
              <td>{pct2(r.personnel, r.revenue)}%</td>
              <td>{pct2(r.overtime, r.revenue)}%</td>
              <td><button onClick={()=>del(i)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

