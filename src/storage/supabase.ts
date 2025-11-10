import { createClient } from "@supabase/supabase-js";
import type { Storage } from "./Storage";
import type { Office, Staff, MonthlyMetrics } from "@/models";

export class SupabaseStorage implements Storage {
  client = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  async loadAll(){
    const [o,s,m] = await Promise.all([
      this.client.from("offices").select("*"),
      this.client.from("staff").select("*"),
      this.client.from("monthly_metrics").select("*"),
    ]);
    return { offices: (o.data as Office[]) || [], staff: (s.data as Staff[]) || [], monthly: (m.data as MonthlyMetrics[]) || [] };
  }

  async saveAll(payload: { offices?: Office[]; staff?: Staff[]; monthly?: MonthlyMetrics[] }){
    if (payload.offices) await this.client.from("offices").upsert(payload.offices, { onConflict: "id" });
    if (payload.staff)   await this.client.from("staff").upsert(payload.staff,   { onConflict: "officeId,name,title" });
    if (payload.monthly) await this.client.from("monthly_metrics").upsert(payload.monthly, { onConflict: "officeId,period" });
    // Emit storage changed for consistency with local storage
    if (typeof BroadcastChannel !== "undefined") {
      const chan = new BroadcastChannel("labpulse-storage");
      chan.postMessage({ type:"storage-changed", ts: Date.now() });
    }
  }
}

