import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function UnitsPatients({ rows, mode }:{ rows:any[]; mode:"units"|"patients" }) {
  return (
    <div style={{height:320, border:"1px solid #eee", padding:8}}>
      <ResponsiveContainer width="100%" height="100%">
        {mode==="units" ? (
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="units" name="Units" />
          </BarChart>
        ) : (
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pts" name="Patients" strokeWidth={2} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

