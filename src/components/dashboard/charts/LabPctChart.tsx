import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function LabPctChart({ rows, includeOutside, goal, showBoth }:{
  rows:any[]; includeOutside:boolean; goal:number; showBoth?:boolean;
}) {
  const data = rows.map(r => ({ ...r, goal }));
  return (
    <div style={{height:320, border:"1px solid #eee", padding:8}}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={[0,20]} tickFormatter={(v)=>`${v}%`} />
          <Tooltip formatter={(v:any)=>typeof v==="number" ? `${v}%` : v} />
          <Legend />
          {showBoth ? (
            <>
              <Line type="monotone" dataKey="labPctExcl" name="Lab % excl" strokeWidth={2} />
              <Line type="monotone" dataKey="labPctIncl" name="Lab % incl" strokeWidth={2} />
            </>
          ) : (
            <Line type="monotone" dataKey={includeOutside?"labPctIncl":"labPctExcl"} name={includeOutside?"Lab % incl":"Lab % excl"} strokeWidth={2} />
          )}
          <Line type="monotone" dataKey="goal" name="Goal" strokeWidth={2} dot={false} stroke="#888" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

