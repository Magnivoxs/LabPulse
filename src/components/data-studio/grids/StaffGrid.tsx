import { useMemo, useState } from "react";
import { normalizeOfficeId } from "@/lib/ids";
import { toast } from "@/components/ui/Toast";

export default function StaffGrid({ rows, offices, onChange }:{
  rows:any[]; offices:any[]; onChange:(rows:any[])=>void;
}) {
  const [draft, setDraft] = useState<any[]>(rows);
  const officeIds = useMemo(()=>offices.map((o:any)=>o.id),[offices]);

  function update(i:number, k:string, v:any) {
    const next=[...draft];
    if (k==="officeId") v = normalizeOfficeId(v);
    next[i]={...next[i],[k]:v};
    setDraft(next);
  }
  function add() { setDraft([{ officeId: officeIds[0] ?? 0, name:"", title:"Processor" }, ...draft]); }
  function del(i:number){ setDraft(draft.filter((_,idx)=>idx!==i)); }
  async function save(){ await onChange(draft); toast("Staff saved"); }

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <button onClick={add}>Add Staff</button>
        <button onClick={save}>Save</button>
      </div>
      <table style={{width:"100%", fontSize:12}}>
        <thead><tr>
          {["officeId","name","title","hireDate","phone",""].map(h=><th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {draft.map((r,i)=>(
            <tr key={i}>
              {["officeId","name","title","hireDate","phone"].map(k=>(
                <td key={k}><input value={(r as any)[k]??""} onChange={e=>update(i,k,e.target.value)} style={{width:"100%"}}/></td>
              ))}
              <td><button onClick={()=>del(i)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

