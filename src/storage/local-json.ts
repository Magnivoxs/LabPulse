import type { Storage } from "./Storage";
import { OfficeSchema } from "@/models/office";
import { StaffSchema } from "@/models/staff";
import { MonthlyMetricsSchema } from "@/models/monthlyMetrics";
import { ensureDir, readJsonSafe, writeJsonAtomic } from "@/lib/fs-helpers";
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

    const offices = await readJsonSafe(FILES.offices, [] as unknown[]);
    const staff   = await readJsonSafe(FILES.staff,   [] as unknown[]);
    const monthly = await readJsonSafe(FILES.monthly, [] as unknown[]);

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
  }
}

