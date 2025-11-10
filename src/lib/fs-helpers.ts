import { isTauri } from "./runtime";

type Json = unknown;

async function delay(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

// ---------- Browser (localStorage) ----------
async function lsEnsureDir(_path: string) { /* no-op */ }

async function lsRead(path: string, fallback: Json){ try{
  const raw = localStorage.getItem(path); return raw ? JSON.parse(raw) : fallback;
}catch{return fallback;} }

async function lsWrite(path: string, data: Json){ localStorage.setItem(path, JSON.stringify(data)); }

// ---------- Tauri FS ----------
let tfs: any = null, baseDir: string | null = null;

async function tauriInit() {
  if (!tfs) {
    try {
      // Dynamic import - Tauri modules only available at runtime in desktop
      // @ts-ignore - Module resolution happens at runtime
      const mod = await import(/* @vite-ignore */ "@tauri-apps/api/fs");
      // @ts-ignore - Module resolution happens at runtime
      const path = await import(/* @vite-ignore */ "@tauri-apps/api/path");
      tfs = mod;
      const appData = await path.appDataDir(); // per-user app data
      baseDir = appData.endsWith("/") ? appData : appData + "/";
    } catch (e) {
      // Tauri modules not available (browser mode)
      throw new Error("Tauri FS not available");
    }
  }
}

async function tauriEnsureDir(rel: string){
  try {
    await tauriInit();
    const parts = rel.split("/").filter(Boolean);
    let cur = baseDir!;
    for (const p of parts) {
      cur += p + "/";
      try { await tfs.createDir(cur, { recursive: true }); } catch {}
    }
  } catch {
    // Fallback to localStorage if Tauri not available
  }
}

async function tauriRead(rel: string, fallback: Json){
  try {
    await tauriInit();
    const full = baseDir! + rel;
    const exists = await tfs.exists(full);
    if (!exists) return fallback;
    const raw = await tfs.readTextFile(full);
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function tauriWrite(rel: string, data: Json){
  try {
    await tauriInit();
    const full = baseDir! + rel;
    const tmp = full + ".tmp";
    await tfs.writeTextFile(tmp, JSON.stringify(data));
    // fs atomic-ish replace
    await tfs.removeFile(full).catch(()=>{});
    await delay(5);
    await tfs.renameFile(tmp, full).catch(async()=>{ await tfs.writeTextFile(full, JSON.stringify(data)); });
  } catch {
    // Fallback to localStorage if Tauri not available
    lsWrite(rel, data);
  }
}

// ---------- Public API ----------
export async function ensureDir(path: string){
  return isTauri ? tauriEnsureDir(path) : lsEnsureDir(path);
}

export async function readJsonSafe<T=unknown>(path: string, fallback: T): Promise<T>{
  return (isTauri ? tauriRead(path, fallback) : lsRead(path, fallback)) as Promise<T>;
}

export async function writeJsonAtomic(path: string, data: Json){
  return isTauri ? tauriWrite(path, data) : lsWrite(path, data);
}
