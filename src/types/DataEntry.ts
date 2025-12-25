// Financial data structure matching Rust backend
export interface FinancialData {
  id?: number;
  office_id: number;
  year: number;
  month: number;
  revenue: number;
  lab_exp_no_outside: number;
  lab_exp_with_outside: number;
  outside_lab_spend: number;
  teeth_supplies: number;
  lab_supplies: number;
  lab_hub: number;
  lss_expense: number;
  personnel_exp: number;
  overtime_exp: number;
  bonus_exp: number;
}

// Office data from database
export interface Office {
  office_id: number;
  office_name: string;
  model: string;
  address?: string;
  phone?: string;
  managing_dentist?: string;
  dfo?: string;
  standardization_status?: string;
}

// Helper for month/year selection
export interface MonthYear {
  month: number;
  year: number;
}

// Calculated metrics for display
export interface FinancialMetrics {
  totalLabExpensesPercent: number;
  personnelPercent: number;
  outsideLabPercent: number;
  overtimePercent: number;
}

