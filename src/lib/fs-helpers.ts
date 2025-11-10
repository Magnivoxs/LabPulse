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
let tfs: any = null;
let pathApi: any = null;
let baseDir: string | null = null;

async function tauriInit() {
  if (!isTauri || tfs) return;

  try {
    // Hide specifiers from Vite by constructing strings at runtime
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const dynImport = new Function("m", "return import(m)") as (m: string) => Promise<any>;
    const fsSpec   = String.fromCharCode(64) + "tauri-apps" + "/api/fs";
    const pathSpec = String.fromCharCode(64) + "tauri-apps" + "/api/path";

    const fsMod   = await dynImport(fsSpec);
    const pathMod = await dynImport(pathSpec);

    tfs = fsMod;
    pathApi = pathMod;

    const appData = await pathApi.appDataDir();
    baseDir = appData.endsWith("/") ? appData : appData + "/";
  } catch (err) {
    console.warn("Tauri FS not available; falling back to localStorage.", err);
    tfs = null;
  }
}

async function tauriEnsureDir(rel: string){
  try {
    await tauriInit();
    if (!tfs || !baseDir) return;
    const parts = rel.split("/").filter(Boolean);
    let cur = baseDir;
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
    if (!tfs || !baseDir) return fallback;
    const full = baseDir + rel;
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
    if (!tfs || !baseDir) {
      // Fallback to localStorage if Tauri not available
      lsWrite(rel, data);
      return;
    }
    const full = baseDir + rel;
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
