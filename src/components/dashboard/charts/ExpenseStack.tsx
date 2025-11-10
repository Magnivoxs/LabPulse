import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function ExpenseStack({ rows }:{ rows:any[] }) {
  return (
    <div style={{height:320, border:"1px solid #eee", padding:8}}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={[0,10]} tickFormatter={(v)=>`${v}%`} />
          <Tooltip formatter={(v:any)=>typeof v==="number" ? `${v}%` : v} />
          <Legend />
          <Area type="monotone" dataKey="teethPct" name="Teeth %" stackId="a" strokeWidth={2} />
          <Area type="monotone" dataKey="suppliesPct" name="Lab supplies %" stackId="a" strokeWidth={2} />
          <Area type="monotone" dataKey="personnelPct" name="Personnel %" stackId="a" strokeWidth={2} />
          <Area type="monotone" dataKey="otPct" name="OT %" stackId="a" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

