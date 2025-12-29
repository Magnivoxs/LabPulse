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

// Operations data structure
export interface OperationsData {
  id?: number;
  office_id: number;
  year: number;
  month: number;
  backlog_case_count: number;
  overtime_value: number;
  labor_model_value: number;
}

// Volume data structure
export interface VolumeData {
  id?: number;
  office_id: number;
  year: number;
  month: number;
  backlog_in_lab: number;
  backlog_in_clinic: number;
  lab_setups: number;
  lab_fixed_cases: number;
  lab_over_denture: number;
  lab_processes: number;
  lab_finishes: number;
  clinic_wax_tryin: number;
  clinic_delivery: number;
  clinic_outside_lab: number;
  clinic_on_hold: number;
  immediate_units: number;
  economy_units: number;
  economy_plus_units: number;
  premium_units: number;
  ultimate_units: number;
  repair_units: number;
  reline_units: number;
  partial_units: number;
  retry_units: number;
  remake_units: number;
  bite_block_units: number;
  total_weekly_units: number;
}

// Weekly volume data structure for drill-down view
export interface WeeklyVolumeData {
  id?: number;
  office_id: number;
  year: number;
  week_number: number;
  lab_setups: number;
  lab_fixed_cases: number;
  lab_over_denture: number;
  lab_processes: number;
  lab_finishes: number;
  clinic_wax_tryin: number;
  clinic_delivery: number;
  clinic_outside_lab: number;
  clinic_on_hold: number;
  immediate_units: number;
  economy_units: number;
  economy_plus_units: number;
  premium_units: number;
  ultimate_units: number;
  repair_units: number;
  reline_units: number;
  partial_units: number;
  retry_units: number;
  remake_units: number;
  bite_block_units: number;
}

// Tab types for navigation
export type DataEntryTab = 'financial' | 'operations' | 'volume' | 'notes';

