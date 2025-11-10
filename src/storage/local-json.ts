import type { Storage } from "./Storage";
import { OfficeSchema } from "@/models/office";
import { StaffSchema } from "@/models/staff";
import { MonthlyMetricsSchema } from "@/models/monthlyMetrics";
import { ensureDir, readJsonSafe, writeJsonAtomic } from "@/lib/fs-helpers";
import { emitStorageChanged } from "@/lib/bus";
import type { Office, Staff, MonthlyMetrics } from "@/models";

const DATA_DIR = "data";
const FILES = {
  offices: `${DATA_DIR}/offices.json`,
  staff:   `${DATA_DIR}/staff.json`,
  monthly: `${DATA_DIR}/monthly_metrics.json`,
};

export class LocalJsonStorage implements Storage {
  async loadAll() {
    await ensureDir(DATA_DIR);

    let offices = await readJsonSafe(FILES.offices, [] as unknown[]);
    let staff   = await readJsonSafe(FILES.staff,   [] as unknown[]);
    let monthly = await readJsonSafe(FILES.monthly, [] as unknown[]);

    // migrate from localStorage-only stores if files empty
    const need = (!offices?.length && localStorage.getItem("data/offices.json")) ||
                 (!staff?.length   && localStorage.getItem("data/staff.json"))   ||
                 (!monthly?.length && localStorage.getItem("data/monthly_metrics.json"));
    if (need) {
      const o = JSON.parse(localStorage.getItem("data/offices.json")||"[]");
      const s = JSON.parse(localStorage.getItem("data/staff.json")||"[]");
      const m = JSON.parse(localStorage.getItem("data/monthly_metrics.json")||"[]");
      await this.saveAll({ offices: o, staff: s, monthly: m });
      offices = o;
      staff = s;
      monthly = m;
    }

    const vOffices = offices.map((o) => OfficeSchema.parse(o));
    const vStaff   = staff.map((s) => StaffSchema.parse(s));
    const vMonthly = monthly.map((m) => MonthlyMetricsSchema.parse(m));

    return { offices: vOffices, staff: vStaff, monthly: vMonthly };
  }

  async saveAll({ offices, staff, monthly }: {
    offices?: Office[];
    staff?: Staff[];
    monthly?: MonthlyMetrics[];
  }) {
    await ensureDir(DATA_DIR);
    if (offices) await writeJsonAtomic(FILES.offices, offices);
    if (staff)   await writeJsonAtomic(FILES.staff,   staff);
    if (monthly) await writeJsonAtomic(FILES.monthly, monthly);
    emitStorageChanged();
  }
}

