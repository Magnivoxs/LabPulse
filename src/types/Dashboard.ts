// Dashboard office summary matching Rust backend
export interface OfficeSummary {
  office_id: number;
  office_name: string;
  model: string;
  dfo?: string;
  latest_month?: number;
  latest_year?: number;
  revenue?: number;
  lab_exp_percent?: number;
  personnel_percent?: number;
  overtime_percent?: number;
  backlog_count?: number;
  has_financial: boolean;
  has_operations: boolean;
  has_volume: boolean;
  has_notes: boolean;
}

// Alert types for office cards
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  severity: AlertSeverity;
  message: string;
}

// Filter options
export interface DashboardFilters {
  state?: string;
  dfo?: string;
  model?: string;
  searchTerm?: string;
  dataStatus?: 'all' | 'complete' | 'partial' | 'none';
}

// Sort options
export type SortOption = 
  | 'name_asc'
  | 'office_id_asc' 
  | 'revenue_desc'
  | 'lab_exp_desc'
  | 'latest_first';

// Helper to determine data completeness status
export function getDataStatus(office: OfficeSummary): 'complete' | 'partial' | 'none' {
  const dataCount = [
    office.has_financial,
    office.has_operations,
    office.has_volume,
  ].filter(Boolean).length;
  
  if (dataCount === 3) return 'complete';
  if (dataCount > 0) return 'partial';
  return 'none';
}

// Helper to generate alerts for an office
export function generateAlerts(office: OfficeSummary): Alert[] {
  const alerts: Alert[] = [];
  
  // No data alert
  if (!office.has_financial && !office.has_operations && !office.has_volume) {
    alerts.push({
      severity: 'info',
      message: 'No data entered for this month',
    });
    return alerts;
  }
  
  // Lab expense alerts
  if (office.lab_exp_percent !== undefined) {
    if (office.lab_exp_percent > 25) {
      alerts.push({
        severity: 'critical',
        message: `Lab expenses at ${office.lab_exp_percent.toFixed(1)}% (>25% critical)`,
      });
    } else if (office.lab_exp_percent > 20) {
      alerts.push({
        severity: 'warning',
        message: `Lab expenses at ${office.lab_exp_percent.toFixed(1)}% (>20% warning)`,
      });
    }
  }
  
  // Personnel expense alerts
  if (office.personnel_percent !== undefined) {
    if (office.personnel_percent > 20) {
      alerts.push({
        severity: 'critical',
        message: `Personnel at ${office.personnel_percent.toFixed(1)}% (>20% critical)`,
      });
    } else if (office.personnel_percent > 15) {
      alerts.push({
        severity: 'warning',
        message: `Personnel at ${office.personnel_percent.toFixed(1)}% (>15% warning)`,
      });
    }
  }
  
  // Backlog alerts
  if (office.backlog_count !== undefined) {
    if (office.backlog_count > 100) {
      alerts.push({
        severity: 'critical',
        message: `Backlog: ${office.backlog_count} cases (>100 critical)`,
      });
    } else if (office.backlog_count > 50) {
      alerts.push({
        severity: 'warning',
        message: `Backlog: ${office.backlog_count} cases (>50 warning)`,
      });
    }
  }
  
  return alerts;
}

// Helper to extract state from office name (e.g., "Albertville, AL" -> "AL")
export function extractState(officeName: string): string {
  const match = officeName.match(/,\s*([A-Z]{2})\s*$/);
  return match ? match[1] : 'Unknown';
}

// Helper to format month name
export function formatMonthYear(month?: number, year?: number): string {
  if (!month || !year) return 'No data';
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return `${monthNames[month - 1]} ${year}`;
}

