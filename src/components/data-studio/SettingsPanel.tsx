import { useEffect, useState } from "react";
import { getAllSettings, setSetting, resetSettings } from "@/lib/settings";
import { emitStorageChanged } from "@/lib/bus";

export default function SettingsPanel() {
  const backend = (import.meta.env.VITE_LABPULSE_STORAGE ?? "local") as "local"|"supabase";
  const hasSupabaseCreds = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  const [settings, setSettings] = useState({ goalLabPct: 13, goalPersonnelPct: 7, thresholds: { teethPct: 4.2, otPct: 1.0 } });

  useEffect(() => {
    getAllSettings().then(s => setSettings({
      goalLabPct: s.goalLabPct,
      goalPersonnelPct: s.goalPersonnelPct,
      thresholds: s.thresholds,
    }));
  }, []);

  const updateThreshold = (key: "teethPct" | "otPct", value: number) => {
    const newThresholds = { ...settings.thresholds, [key]: value };
    setSettings({ ...settings, thresholds: newThresholds });
    setSetting("thresholds", newThresholds);
    emitStorageChanged();
  };

  const updateGoal = (key: "goalLabPct" | "goalPersonnelPct", value: number) => {
    setSettings({ ...settings, [key]: value });
    setSetting(key, value);
    emitStorageChanged();
  };

  return (
    <div style={{display:"grid", gap:16}}>
      <div>
        <h3 style={{marginTop:0}}>Storage Backend</h3>
        <p><strong>Current:</strong> {backend === "supabase" ? "Supabase" : "Local JSON"}</p>
        {backend === "supabase" && !hasSupabaseCreds && (
          <p style={{color:"#d97706", fontSize:12}}>
            ⚠️ Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
          </p>
        )}
        {backend === "local" && (
          <p style={{fontSize:12, color:"#6b7280"}}>
            Data stored in {typeof window !== "undefined" && "__TAURI_INTERNALS__" in (window as any) ? "app data directory" : "browser localStorage"}
          </p>
        )}
      </div>

      <div>
        <h3>Anomaly Thresholds</h3>
        <div style={{display:"grid", gap:8, gridTemplateColumns:"1fr 80px"}}>
          <label>Teeth Supplies % Alert:</label>
          <input type="number" step="0.1" value={settings.thresholds.teethPct} onChange={e=>updateThreshold("teethPct", Number(e.target.value))} style={{width:"100%"}} />
          <label>Overtime % Alert:</label>
          <input type="number" step="0.1" value={settings.thresholds.otPct} onChange={e=>updateThreshold("otPct", Number(e.target.value))} style={{width:"100%"}} />
        </div>
      </div>

      <div>
        <h3>Goal Thresholds</h3>
        <div style={{display:"grid", gap:8, gridTemplateColumns:"1fr 80px"}}>
          <label>Lab % Goal:</label>
          <input type="number" value={settings.goalLabPct} onChange={e=>updateGoal("goalLabPct", Number(e.target.value))} style={{width:"100%"}} />
          <label>Personnel % Goal:</label>
          <input type="number" value={settings.goalPersonnelPct} onChange={e=>updateGoal("goalPersonnelPct", Number(e.target.value))} style={{width:"100%"}} />
        </div>
      </div>

      <div>
        <button onClick={async()=>{await resetSettings(); window.location.reload();}} style={{padding:"6px 12px", fontSize:12}}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

