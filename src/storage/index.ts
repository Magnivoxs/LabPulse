import { LocalJsonStorage } from "./local-json";
import type { Storage } from "./Storage";
// Static import - Vite will include it but code path guards usage
import { SupabaseStorage } from "./supabase";

export function getStorage(): Storage {
  const backend = (import.meta.env.VITE_LABPULSE_STORAGE ?? "local") as "local"|"supabase";
  if (backend === "supabase") {
    const hasCreds = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (hasCreds) {
      return new SupabaseStorage();
    }
  }
  return new LocalJsonStorage();
}

