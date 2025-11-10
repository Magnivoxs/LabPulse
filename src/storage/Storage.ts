import type { Office, Staff, MonthlyMetrics } from "@/models";

export interface Storage {
  loadAll(): Promise<{
    offices: Office[];
    staff: Staff[];
    monthly: MonthlyMetrics[];
  }>;

  saveAll(payload: {
    offices?: Office[];
    staff?: Staff[];
    monthly?: MonthlyMetrics[];
  }): Promise<void>;
}

