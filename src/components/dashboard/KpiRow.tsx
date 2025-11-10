function color(v:number, goal:number, inverse=false){
  const ok = inverse ? v>=goal : v<=goal;
  return { color: ok ? "#059669" : "#dc2626" };
}

export default function KpiRow(props:{
  latestRev:number; labPct:number; goalLabPct:number;
  personnelPct:number; goalPersonnelPct:number;
  staffCount:number; alerts:{teeth:boolean; ot:boolean};
  thresholds:{teethPct:number; otPct:number};
}) {
  const { latestRev, labPct, personnelPct, staffCount, alerts } = props;
  return (
    <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(4,1fr)"}}>
      <div style={{border:"1px solid #eee", padding:12}}>
        <div>Revenue (Last)</div>
        <div style={{fontSize:22, fontWeight:600}}>${latestRev.toLocaleString()}</div>
      </div>
      <div style={{border:"1px solid #eee", padding:12}}>
        <div>Lab %</div>
        <div style={{fontSize:22, fontWeight:600, ...color(labPct, props.goalLabPct)}}>{labPct}%</div>
        <div style={{fontSize:12}}>Goal ≤ {props.goalLabPct}%</div>
      </div>
      <div style={{border:"1px solid #eee", padding:12}}>
        <div>Personnel %</div>
        <div style={{fontSize:22, fontWeight:600, ...color(personnelPct, props.goalPersonnelPct)}}>{personnelPct}%</div>
        <div style={{fontSize:12}}>Goal ≤ {props.goalPersonnelPct}% · Staff {staffCount}</div>
      </div>
      <div style={{border:"1px solid #eee", padding:12}}>
        <div>Alerts</div>
        <ul style={{margin:"6px 0 0 18px", fontSize:14}}>
          <li style={{color: alerts.teeth ? "#d97706":"#6b7280"}}>Teeth supplies {alerts.teeth ? "high":"normal"}</li>
          <li style={{color: alerts.ot ? "#d97706":"#6b7280"}}>Overtime {alerts.ot ? "high":"normal"}</li>
        </ul>
      </div>
    </div>
  );
}

