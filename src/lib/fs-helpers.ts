/**
 * M1: browser dev uses localStorage to avoid file moves.
 * M6: swap to real FS via Tauri using the same API.
 */
export async function ensureDir(_path: string) {
  // no-op for localStorage mode
}

export async function readJsonSafe<T = unknown>(path: string, fallback: T): Promise<T> {
  try {
    const raw = localStorage.getItem(path);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonAtomic(path: string, data: unknown): Promise<void> {
  const tmp = JSON.stringify(data);
  localStorage.setItem(path, tmp);
}

