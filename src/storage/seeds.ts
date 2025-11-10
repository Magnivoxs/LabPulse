import type { Office, Staff, MonthlyMetrics } from "@/models";

export const seedOffices: Office[] = [
  { id: 7033, name: "Chattanooga", state: "TN", address: "123 Main St", phone: "(423) 555-1033", practiceModel: "PLLC", managingDentist: "M. Howard", dfo: "C. Adams", standardizationStatus: "Graduated", laborModel: -0.3 },
  { id: 3074, name: "Memphis", state: "TN", address: "45 Peabody Ave", phone: "(901) 555-3074", practiceModel: "PO", managingDentist: "A. Rivera", dfo: "K. Stone", standardizationStatus: "Training Plan", laborModel: 0.6 },
  { id: 3020, name: "Kennesaw", state: "GA", address: "10 Cobb Pkwy", phone: "(770) 555-3020", practiceModel: "PLLC", managingDentist: "J. Patel", dfo: "R. Bell", standardizationStatus: "Graduated", laborModel: 0.0 }
];

export const seedStaff: Staff[] = [
  { officeId: 7033, name: "Matthew Howard", title: "Lab Manager", hireDate: "2020-03-01" },
  { officeId: 7033, name: "Laura Chen", title: "Full Tech", hireDate: "2021-06-15" },
  { officeId: 7033, name: "John Smith", title: "Waxer Finisher", hireDate: "2022-01-10" },
  { officeId: 7033, name: "Sarah Wilson", title: "Processor", hireDate: "2023-02-18" },
  { officeId: 3074, name: "Alejandro Rivera", title: "Lab Manager", hireDate: "2019-05-12" },
  { officeId: 3074, name: "Emma White", title: "Full Tech", hireDate: "2021-08-10" },
  { officeId: 3074, name: "Noah Green", title: "Waxer Finisher", hireDate: "2022-04-12" },
  { officeId: 3020, name: "Jay Patel", title: "Lab Manager", hireDate: "2018-11-01" },
  { officeId: 3020, name: "Karen Lee", title: "Full Tech", hireDate: "2021-03-05" },
  { officeId: 3020, name: "James Davis", title: "Waxer Finisher", hireDate: "2022-09-17" },
  { officeId: 3020, name: "Maria Lopez", title: "Processor", hireDate: "2023-06-11" }
];

export const seedMonthly: MonthlyMetrics[] = [
  { officeId: 7033, period: "2025-01", revenue: 82000, labExpenses: 9300, outsideLab: 900, teethSupplies: 2700, labSupplies: 2300, personnel: 5400, overtime: 400, bonuses: 600, units: 145, patients: 380 },
  { officeId: 7033, period: "2025-02", revenue: 86000, labExpenses: 9800, outsideLab: 1200, teethSupplies: 3100, labSupplies: 2400, personnel: 5600, overtime: 300, bonuses: 500, units: 152, patients: 395 },
  { officeId: 7033, period: "2025-03", revenue: 90500, labExpenses: 10100, outsideLab: 1300, teethSupplies: 3400, labSupplies: 2500, personnel: 5700, overtime: 500, bonuses: 650, units: 160, patients: 410 },
  { officeId: 3074, period: "2025-01", revenue: 78000, labExpenses: 11800, outsideLab: 1400, teethSupplies: 4300, labSupplies: 3100, personnel: 6800, overtime: 900, bonuses: 400, units: 140, patients: 360 },
  { officeId: 3074, period: "2025-02", revenue: 76000, labExpenses: 12100, outsideLab: 1500, teethSupplies: 4500, labSupplies: 3200, personnel: 6900, overtime: 950, bonuses: 400, units: 136, patients: 350 },
  { officeId: 3020, period: "2025-01", revenue: 72000, labExpenses: 9100, outsideLab: 700, teethSupplies: 2600, labSupplies: 2100, personnel: 4800, overtime: 250, bonuses: 500, units: 130, patients: 340 },
  { officeId: 3020, period: "2025-02", revenue: 74000, labExpenses: 9200, outsideLab: 800, teethSupplies: 2700, labSupplies: 2150, personnel: 4900, overtime: 260, bonuses: 500, units: 134, patients: 345 }
];

