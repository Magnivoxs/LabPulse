import { isTauri } from "./runtime";
import { readJsonSafe, writeJsonAtomic } from "./fs-helpers";

export interface UISettings {
  goalLabPct: number;
  goalPersonnelPct: number;
  includeOutside: boolean;
  lastOfficeId: number | null;
  thresholds: {
    teethPct: number;
    otPct: number;
  };
}

const DEFAULTS: UISettings = {
  goalLabPct: 13,
  goalPersonnelPct: 7,
  includeOutside: true,
  lastOfficeId: null,
  thresholds: {
    teethPct: 4.2,
    otPct: 1.0,
  },
};

const SETTINGS_KEY = "data/settings.json";
const LS_PREFIX = "ui.";

// Browser localStorage helpers
function lsGet<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(LS_PREFIX + key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: any) {
  localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
}

// Desktop filesystem helpers
async function fsGet<T>(key: string, fallback: T): Promise<T> {
  const settings = await readJsonSafe<UISettings>(SETTINGS_KEY, DEFAULTS);
  return (settings as any)[key] ?? fallback;
}

async function fsSet(key: string, value: any) {
  const current = await readJsonSafe<UISettings>(SETTINGS_KEY, DEFAULTS);
  (current as any)[key] = value;
  await writeJsonAtomic(SETTINGS_KEY, current);
}

// Public API
export async function getSetting<T extends keyof UISettings>(key: T): Promise<UISettings[T]> {
  if (isTauri) {
    return await fsGet(key, DEFAULTS[key]);
  }
  return lsGet(key, DEFAULTS[key]);
}

export async function setSetting<T extends keyof UISettings>(key: T, value: UISettings[T]): Promise<void> {
  if (isTauri) {
    await fsSet(key, value);
  } else {
    lsSet(key, value);
  }
}

export async function getAllSettings(): Promise<UISettings> {
  if (isTauri) {
    return await readJsonSafe<UISettings>(SETTINGS_KEY, DEFAULTS);
  }
  return {
    goalLabPct: lsGet("goalLabPct", DEFAULTS.goalLabPct),
    goalPersonnelPct: lsGet("goalPersonnelPct", DEFAULTS.goalPersonnelPct),
    includeOutside: lsGet("includeOutside", DEFAULTS.includeOutside),
    lastOfficeId: lsGet("lastOfficeId", DEFAULTS.lastOfficeId),
    thresholds: lsGet("thresholds", DEFAULTS.thresholds),
  };
}

export async function resetSettings(): Promise<void> {
  if (isTauri) {
    await writeJsonAtomic(SETTINGS_KEY, DEFAULTS);
  } else {
    Object.keys(DEFAULTS).forEach(k => localStorage.removeItem(LS_PREFIX + k));
    Object.entries(DEFAULTS).forEach(([k, v]) => lsSet(k, v));
  }
}

