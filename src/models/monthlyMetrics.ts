import { z } from "zod";

export const MonthlyMetricsSchema = z.object({
  officeId: z.number().int().nonnegative(),
  period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  revenue: z.number().nonnegative(),
  labExpenses: z.number().nonnegative(),
  outsideLab: z.number().nonnegative(),
  teethSupplies: z.number().nonnegative(),
  labSupplies: z.number().nonnegative(),
  personnel: z.number().nonnegative(),
  overtime: z.number().nonnegative(),
  bonuses: z.number().nonnegative(),
  units: z.number().int().nonnegative(),
  patients: z.number().int().nonnegative(),
});

export type MonthlyMetrics = z.infer<typeof MonthlyMetricsSchema>;

