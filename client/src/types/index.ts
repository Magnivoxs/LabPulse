export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Lab {
  id: string;
  officeId: string;
  city: string;
  state: string;
  practiceModel: 'PO' | 'PLLC';
  address: string;
  phone: string;
  managingDentist: string;
  directorFieldOps: string;
  standardizationStatus: 'Training Plan' | 'Graduated';
  hasBacklog: boolean;
  hasOvertime: boolean;
  laborModel: number;
  standardizationComplete: boolean;
  labManagerName?: string;
  labManagerEmail?: string;
  labManagerPhone?: string;
  totalStaff: number;
  countLabManagers: number;
  countFullTechs: number;
  countWaxerFinishers: number;
  countProcessors: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  employees?: Employee[];
  metrics?: MonthlyMetric[];
}

export interface Employee {
  id: string;
  name: string;
  position: 'Lab Manager' | 'Full Tech' | 'Waxer Finisher' | 'Processor';
  hireDate: string;
  email?: string;
  phone?: string;
  labId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyMetric {
  id: string;
  month: number;
  year: number;
  dentureUnits: number;
  patientVolume: number;
  practiceRevenue: number;
  totalLabExpenses: number;
  teethSupplies: number;
  labSupplies: number;
  totalLabExpensesWithOutside: number;
  totalPersonnelExpenses: number;
  overtimeExpenses: number;
  bonuses: number;
  hadBacklog: boolean;
  hadOvertime: boolean;
  labId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricPercentages {
  totalLabExpensesPercent: number;
  totalLabExpensesWithOutsidePercent: number;
  teethSuppliesPercent: number;
  labSuppliesPercent: number;
  personnelExpensesPercent: number;
  overtimeExpensesPercent: number;
  bonusesPercent: number;
}

export interface Anomalies {
  hasHighLabExpenses: boolean;
  hasHighPersonnelExpenses: boolean;
  hasBacklog: boolean;
  hasOvertime: boolean;
  isUnderstaffed: boolean;
  isOverstaffed: boolean;
  revenueDecline: boolean;
}

export type AlertLevel = 'green' | 'yellow' | 'red';

export interface LabWithAnalytics extends Lab {
  currentMetric?: MonthlyMetric;
  previousMetric?: MonthlyMetric;
  percentages?: MetricPercentages;
  anomalies?: Anomalies;
  severityScore?: number;
  alertLevel: AlertLevel;
}

export interface DashboardOverview {
  summary: {
    totalLabs: number;
    totalEmployees: number;
    totalRevenue: number;
    alertCounts: {
      red: number;
      yellow: number;
      green: number;
    };
  };
  labs: LabWithAnalytics[];
}

export interface LabDashboard {
  lab: Lab;
  metrics: (MonthlyMetric & { percentages: MetricPercentages })[];
  anomalies: Anomalies | null;
  alertLevel: AlertLevel;
}
