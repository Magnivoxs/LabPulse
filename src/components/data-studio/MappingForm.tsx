import React from "react";
import type { Entity } from "@/lib/validate";

type Props = {
  entity: Entity;
  headers: string[];
  fields: string[];
  mapping: Record<string,string>;
  onChange: (m: Record<string,string>) => void;
};

export default function MappingForm({ headers, fields, mapping, onChange }: Props) {
  const set = (field: string, src: string) => onChange({ ...mapping, [field]: src });
  return (
    <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:8}}>
      {fields.map(f => (
        <React.Fragment key={f}>
          <div>{f}</div>
          <select value={mapping[f] ?? ""} onChange={e=>set(f, e.target.value)}>
            <option value="">—</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </React.Fragment>
      ))}
    </div>
  );
}

