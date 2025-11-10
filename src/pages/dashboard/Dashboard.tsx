import { useEffect, useMemo, useState } from "react";
import { getStorage } from "@/storage";
import { enrichForCharts, groupByOffice, latestYoY } from "@/lib/analytics";
import { onStorageChanged } from "@/lib/bus";
import { getAllSettings, setSetting, getSetting } from "@/lib/settings";
import KpiRow from "@/components/dashboard/KpiRow";
import LabPctChart from "@/components/dashboard/charts/LabPctChart";
import ExpenseStack from "@/components/dashboard/charts/ExpenseStack";
import UnitsPatients from "@/components/dashboard/charts/UnitsPatients";
import OfficeCompare from "@/components/dashboard/OfficeCompare";

const storage = getStorage();

export default function Dashboard() {
  const [data, setData] = useState<any>({ offices: [], staff: [], monthly: [] });
  const [officeId, setOfficeId] = useState<number | null>(null);
  const [includeOutside, setIncludeOutside] = useState(true);
  const [goalLabPct, setGoalLabPct] = useState(13);
  const [goalPersonnelPct, setGoalPersonnelPct] = useState(7);
  const [thresholds, setThresholds] = useState({ teethPct: 4.2, otPct: 1.0 });

  async function reload() { setData(await storage.loadAll()); }
  useEffect(()=>{ reload(); }, []);
  useEffect(()=>{
    const off = onStorageChanged(()=> reload());
    return off;
  }, []);

  // Load settings
  useEffect(()=>{
    getAllSettings().then(s => {
      setGoalLabPct(s.goalLabPct);
      setGoalPersonnelPct(s.goalPersonnelPct);
      setIncludeOutside(s.includeOutside);
      setThresholds(s.thresholds);
      if (s.lastOfficeId) setOfficeId(s.lastOfficeId);
    });
  }, []);

  // Reload thresholds when storage changes (Settings panel updates)
  useEffect(()=>{
    const off = onStorageChanged(()=> {
      getAllSettings().then(s => {
        setGoalLabPct(s.goalLabPct);
        setGoalPersonnelPct(s.goalPersonnelPct);
        setThresholds(s.thresholds);
      });
    });
    return off;
  }, []);

  useEffect(()=>{
    if (!officeId && data.offices.length) {
      getSetting("lastOfficeId").then(id => {
        setOfficeId(id ?? data.offices[0].id);
      });
    }
  }, [data.offices, officeId]);

  // Persist settings on change
  useEffect(()=>{ if (officeId) setSetting("lastOfficeId", officeId); }, [officeId]);
  useEffect(()=>{ setSetting("includeOutside", includeOutside); }, [includeOutside]);
  useEffect(()=>{ setSetting("goalLabPct", goalLabPct); }, [goalLabPct]);
  useEffect(()=>{ setSetting("goalPersonnelPct", goalPersonnelPct); }, [goalPersonnelPct]);

  const officeSeries = useMemo(() => {
    const byOffice = groupByOffice(data.monthly ?? []);
    const series = officeId ? (byOffice.get(officeId) ?? []) : [];
    return enrichForCharts(series);
  }, [data.monthly, officeId]);

  const latest = officeSeries.at(-1);
  const labPct = latest ? (includeOutside ? latest.labPctIncl : latest.labPctExcl) : 0;
  const personnelPct = latest?.personnelPct ?? 0;

  // YoY deltas for KPI badges
  const { labYoY, personnelYoY } = useMemo(() => {
    const byOffice = groupByOffice(data.monthly ?? []);
    const series = officeId ? (byOffice.get(officeId) ?? []) : [];
    return latestYoY(series as any);
  }, [data.monthly, officeId]);

  const teethAnom = latest ? latest.teethPct > thresholds.teethPct : false;
  const otAnom = latest ? latest.otPct > thresholds.otPct : false;

  return (
    <div style={{padding:16, display:"grid", gap:12}}>
      {/* Controls */}
      <div style={{display:"flex", gap:12, alignItems:"center"}}>
        <select value={officeId ?? ""} onChange={e=>setOfficeId(Number(e.target.value))}>
          {data.offices.map((o:any)=><option key={o.id} value={o.id}>{o.id} · {o.name}, {o.state}</option>)}
        </select>
        <label><input type="checkbox" checked={includeOutside} onChange={e=>setIncludeOutside(e.target.checked)} /> Include Outside Lab</label>
        <label>Lab % Goal <input type="number" value={goalLabPct} onChange={e=>setGoalLabPct(Number(e.target.value))} style={{width:60}}/></label>
        <label>Personnel % Goal <input type="number" value={goalPersonnelPct} onChange={e=>setGoalPersonnelPct(Number(e.target.value))} style={{width:60}}/></label>
      </div>

      <KpiRow
        latestRev={latest?.rev ?? 0}
        labPct={labPct}
        goalLabPct={goalLabPct}
        personnelPct={personnelPct}
        goalPersonnelPct={goalPersonnelPct}
        staffCount={data.staff.filter((s:any)=>s.officeId===officeId).length}
        alerts={{ teeth: teethAnom, ot: otAnom }}
        yoy={{ lab: labYoY, personnel: personnelYoY }}
      />

      {/* Charts */}
      <div>
        <h3>Overview: Lab % vs Goal</h3>
        <LabPctChart rows={officeSeries} includeOutside={includeOutside} goal={goalLabPct}/>
      </div>

      <div style={{display:"grid", gap:12, gridTemplateColumns:"1fr 1fr"}}>
        <div>
          <h3>Expense % Breakdown</h3>
          <ExpenseStack rows={officeSeries}/>
        </div>
        <div>
          <h3>Lab % Incl vs Excl Outside</h3>
          <LabPctChart rows={officeSeries} includeOutside={true} goal={goalLabPct} showBoth />
        </div>
      </div>

      <div style={{display:"grid", gap:12, gridTemplateColumns:"1fr 1fr"}}>
        <div>
          <h3>Denture Units</h3>
          <UnitsPatients rows={officeSeries} mode="units"/>
        </div>
        <div>
          <h3>Patient Volume</h3>
          <UnitsPatients rows={officeSeries} mode="patients"/>
        </div>
      </div>

      <div>
        <h3>Office Comparison (last period)</h3>
        <OfficeCompare offices={data.offices} monthly={data.monthly}/>
      </div>
    </div>
  );
}

