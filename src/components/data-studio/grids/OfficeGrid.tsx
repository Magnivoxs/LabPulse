import { useState } from "react";
import { normalizeOfficeId } from "@/lib/ids";
import { toast } from "@/components/ui/Toast";

export default function OfficeGrid({ rows, onChange }:{
  rows: any[]; onChange: (rows:any[])=>void;
}) {
  const [draft, setDraft] = useState<any[]>(rows);

  function update(i:number, k:string, v:any) {
    const next = [...draft];
    if (k==="id") v = normalizeOfficeId(v);
    next[i] = { ...next[i], [k]: v };
    setDraft(next);
  }
  function add() {
    setDraft([{ id: 0, name:"", state:"", practiceModel:"PLLC",
      standardizationStatus:"Training Plan", laborModel:0 }, ...draft]);
  }
  function del(i:number) { setDraft(draft.filter((_,idx)=>idx!==i)); }

  async function save() { await onChange(draft); toast("Offices saved"); }

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <button onClick={add}>Add Office</button>
        <button onClick={save}>Save</button>
      </div>
      <table style={{width:"100%", fontSize:12}}>
        <thead><tr>
          {["id","name","state","address","phone","practiceModel","managingDentist","dfo","standardizationStatus","laborModel",""].map(h=><th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {draft.map((r,i)=>(
            <tr key={i}>
              {["id","name","state","address","phone","practiceModel","managingDentist","dfo","standardizationStatus","laborModel"].map(k=>(
                <td key={k}><input
                  value={(r as any)[k] ?? ""}
                  onChange={e=>update(i,k,e.target.value)}
                  style={{width:"100%"}} /></td>
              ))}
              <td><button onClick={()=>del(i)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

