import { useMemo, useState, useEffect } from "react";
import { parseXlsx } from "@/lib/xlsx";
import { parseCsv } from "@/lib/csv";
import MappingForm from "./MappingForm";
import { validateRows, type Entity } from "@/lib/validate";
import { getStorage } from "@/storage";
import { normalizeOfficeId } from "@/lib/ids";
import { downloadTemplate } from "@/lib/export";

const storage = getStorage();

const Fields: Record<Entity,string[]> = {
  Office: ["id","name","state","address","phone","practiceModel","managingDentist","dfo","standardizationStatus","laborModel"],
  Staff: ["officeId","name","title","hireDate","phone"],
  Monthly: ["officeId","period","revenue","labExpenses","outsideLab","teethSupplies","labSupplies","personnel","overtime","bonuses","units","patients"],
};

export default function ImportPanel() {
  const [entity, setEntity] = useState<Entity>("Monthly");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string,string>>(() => {
    const k = "labpulse.mapping."+entity;
    try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch { return {}; }
  });
  const [mode, setMode] = useState<"add"|"upsert">("upsert");
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<{index:number;message:string}[]>([]);

  const fields = Fields[entity];

  // Reload mapping when entity changes
  useEffect(() => {
    const k = "labpulse.mapping."+entity;
    try { 
      const saved = JSON.parse(localStorage.getItem(k) || "{}");
      setMapping(saved);
    } catch { 
      setMapping({});
    }
  }, [entity]);

  const mapped = useMemo(() => {
    const m = mapping;
    return rows.map(r => Object.fromEntries(fields.map(f=>{
      let v = r[m[f] || ""];
      if (f === "officeId" || f === "id") v = normalizeOfficeId(v);
      return [f, v === "" || v === undefined ? null : (typeof v === "string" ? v.trim() : v)];
    })));
  }, [rows, mapping, entity, fields]);

  function saveMapping() {
    const k = "labpulse.mapping."+entity;
    localStorage.setItem(k, JSON.stringify(mapping));
  }

  async function handleFile(file: File) {
    const isX = /\.xlsx?$/i.test(file.name);
    const { headers, rows } = isX ? await parseXlsx(file) : await file.text().then(parseCsv);
    setHeaders(headers); setRows(rows);
  }

  function handlePaste(text: string) {
    parseCsv(text).then(({ headers, rows }) => { setHeaders(headers); setRows(rows); });
  }

  function exportErrorsCsv() {
    const lines = ["row,message", ...errors.map(e=>`${e.index+2},${JSON.stringify(e.message)}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "import_errors.csv"; a.click();
  }

  async function importNow() {
    const { ok, errors } = validateRows(entity, mapped);
    setPreview(ok.slice(0, 10));
    setErrors(errors);
    if (errors.length) return;

    const current = await storage.loadAll();
    if (entity === "Office") {
      const byId = new Map(current.offices.map(o=>[o.id,o]));
      ok.forEach((r:any) => mode==="upsert" ? byId.set(r.id, r) : byId.set(r.id, byId.has(r.id) ? byId.get(r.id)! : r));
      await storage.saveAll({ offices: Array.from(byId.values()) });
    } else if (entity === "Staff") {
      const key = (r:any)=>`${r.officeId}|${r.name}|${r.title}`;
      const byKey = new Map(current.staff.map(s=>[key(s), s]));
      ok.forEach((r:any)=> mode==="upsert" ? byKey.set(key(r), r) : byKey.set(key(r), byKey.has(key(r)) ? byKey.get(key(r))! : r));
      await storage.saveAll({ staff: Array.from(byKey.values()) });
    } else {
      const key = (r:any)=>`${r.officeId}|${r.period}`;
      const byKey = new Map(current.monthly.map(m=>[key(m), m]));
      ok.forEach((r:any)=> mode==="upsert" ? byKey.set(key(r), r) : byKey.set(key(r), byKey.has(key(r)) ? byKey.get(key(r))! : r));
      await storage.saveAll({ monthly: Array.from(byKey.values()) });
    }
    alert("Import complete.");
  }

  return (
    <div style={{display:"grid",gap:12}}>
      <div style={{display:"flex",gap:8,alignItems:"center", flexWrap:"wrap"}}>
        <label>Entity:</label>
        <select value={entity} onChange={e=>{setEntity(e.target.value as Entity); setMapping({});}}>
          <option>Monthly</option><option>Office</option><option>Staff</option>
        </select>
        <label>Mode:</label>
        <select value={mode} onChange={e=>setMode(e.target.value as any)}>
          <option value="upsert">Upsert</option>
          <option value="add">Add Only</option>
        </select>
        <button onClick={saveMapping}>Save Mapping</button>
        <button onClick={()=>downloadTemplate(Fields[entity], `${entity.toLowerCase()}_template.csv`)} style={{marginLeft:"auto"}}>
          Download Template
        </button>
      </div>

      <div style={{border:"1px dashed #bbb",padding:16}}>
        <input type="file" onChange={e=>{const f=e.target.files?.[0]; if (f) handleFile(f);}} />
        <textarea placeholder="Or paste CSV here" onBlur={e=>handlePaste(e.target.value)} style={{width:"100%",height:120,marginTop:8}}/>
      </div>

      {!!headers.length && (
        <>
          <h4>Map columns</h4>
          <MappingForm entity={entity} headers={headers} fields={fields} mapping={mapping} onChange={setMapping}/>
          <button onClick={importNow}>Validate & Import</button>
          {errors.length ? (
            <div style={{color:"#b00"}}>
              <p>{errors.length} error(s). <button onClick={exportErrorsCsv}>Download errors CSV</button></p>
            </div>
          ) : null}
          {preview.length ? (
            <div>
              <h4>Preview (first 10 valid rows)</h4>
              <pre style={{fontSize:12}}>{JSON.stringify(preview, null, 2)}</pre>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

