/**
 * Utility functions for KPI calculations and anomaly detection
 */

export interface MetricCalculations {
  totalLabExpensesPercent: number;
  totalLabExpensesWithOutsidePercent: number;
  teethSuppliesPercent: number;
  labSuppliesPercent: number;
  personnelExpensesPercent: number;
  overtimeExpensesPercent: number;
  bonusesPercent: number;
}

export const calculateMetricPercentages = (
  practiceRevenue: number,
  expenses: {
    totalLabExpenses: number;
    totalLabExpensesWithOutside: number;
    teethSupplies: number;
    labSupplies: number;
    totalPersonnelExpenses: number;
    overtimeExpenses: number;
    bonuses: number;
  }
): MetricCalculations => {
  if (practiceRevenue === 0) {
    return {
      totalLabExpensesPercent: 0,
      totalLabExpensesWithOutsidePercent: 0,
      teethSuppliesPercent: 0,
      labSuppliesPercent: 0,
      personnelExpensesPercent: 0,
      overtimeExpensesPercent: 0,
      bonusesPercent: 0,
    };
  }

  return {
    totalLabExpensesPercent: (expenses.totalLabExpenses / practiceRevenue) * 100,
    totalLabExpensesWithOutsidePercent: (expenses.totalLabExpensesWithOutside / practiceRevenue) * 100,
    teethSuppliesPercent: (expenses.teethSupplies / practiceRevenue) * 100,
    labSuppliesPercent: (expenses.labSupplies / practiceRevenue) * 100,
    personnelExpensesPercent: (expenses.totalPersonnelExpenses / practiceRevenue) * 100,
    overtimeExpensesPercent: (expenses.overtimeExpenses / practiceRevenue) * 100,
    bonusesPercent: (expenses.bonuses / practiceRevenue) * 100,
  };
};

export interface AnomalyFlags {
  hasHighLabExpenses: boolean; // >13%
  hasHighPersonnelExpenses: boolean; // >7%
  hasBacklog: boolean;
  hasOvertime: boolean;
  isUnderstaffed: boolean; // labor model < -1
  isOverstaffed: boolean; // labor model > 1
  revenueDecline: boolean; // compared to previous period
}

export const detectAnomalies = (
  lab: {
    hasBacklog: boolean;
    hasOvertime: boolean;
    laborModel: number;
  },
  currentMetric: {
    practiceRevenue: number;
    totalLabExpenses: number;
    totalPersonnelExpenses: number;
  },
  previousMetric?: {
    practiceRevenue: number;
  }
): AnomalyFlags => {
  const percentages = calculateMetricPercentages(currentMetric.practiceRevenue, {
    totalLabExpenses: currentMetric.totalLabExpenses,
    totalLabExpensesWithOutside: 0,
    teethSupplies: 0,
    labSupplies: 0,
    totalPersonnelExpenses: currentMetric.totalPersonnelExpenses,
    overtimeExpenses: 0,
    bonuses: 0,
  });

  const revenueDecline = previousMetric
    ? currentMetric.practiceRevenue < previousMetric.practiceRevenue * 0.9 // 10% decline
    : false;

  return {
    hasHighLabExpenses: percentages.totalLabExpensesPercent > 13,
    hasHighPersonnelExpenses: percentages.personnelExpensesPercent > 7,
    hasBacklog: lab.hasBacklog,
    hasOvertime: lab.hasOvertime,
    isUnderstaffed: lab.laborModel < -1,
    isOverstaffed: lab.laborModel > 1,
    revenueDecline,
  };
};

export const calculateSeverityScore = (anomalies: AnomalyFlags): number => {
  let score = 0;
  if (anomalies.hasHighLabExpenses) score += 3;
  if (anomalies.hasHighPersonnelExpenses) score += 3;
  if (anomalies.hasBacklog) score += 2;
  if (anomalies.hasOvertime) score += 2;
  if (anomalies.isUnderstaffed) score += 2;
  if (anomalies.isOverstaffed) score += 1;
  if (anomalies.revenueDecline) score += 3;
  return score;
};

export const getAlertLevel = (score: number): 'green' | 'yellow' | 'red' => {
  if (score >= 5) return 'red';
  if (score >= 2) return 'yellow';
  return 'green';
};
