import { OfficeSchema } from "@/models/office";
import { StaffSchema } from "@/models/staff";
import { MonthlyMetricsSchema } from "@/models/monthlyMetrics";
import { z } from "zod";

export const EntitySchemas = {
  Office: OfficeSchema,
  Staff: StaffSchema,
  Monthly: MonthlyMetricsSchema,
} as const;

export type Entity = keyof typeof EntitySchemas;

export function validateRows(entity: Entity, rows: any[]) {
  const schema = EntitySchemas[entity] as z.ZodSchema<any>;
  const ok: any[] = [];
  const errors: { index: number; message: string }[] = [];
  rows.forEach((r, i) => {
    try { ok.push(schema.parse(r)); }
    catch (e: any) { errors.push({ index: i, message: e.errors?.[0]?.message ?? String(e) }); }
  });
  return { ok, errors };
}

