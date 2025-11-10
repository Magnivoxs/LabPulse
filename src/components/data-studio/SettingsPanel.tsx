export default function SettingsPanel() {
  const backend = (import.meta.env.VITE_LABPULSE_STORAGE ?? "local") as "local"|"supabase";
  const hasSupabaseCreds = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  return (
    <div style={{display:"grid", gap:12}}>
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
    </div>
  );
}

