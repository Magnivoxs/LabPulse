import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  calculateMetricPercentages,
  detectAnomalies,
  calculateSeverityScore,
  getAlertLevel,
} from '../utils/calculations';

const router = Router();
const prisma = new PrismaClient();

// Get dashboard overview for all labs
router.get('/overview', authenticate, async (req: AuthRequest, res) => {
  try {
    const labs = await prisma.lab.findMany({
      where: { userId: req.userId },
      include: {
        employees: true,
        metrics: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 2, // Current and previous month
        },
      },
    });

    // Calculate aggregate stats
    const totalLabs = labs.length;
    const totalEmployees = labs.reduce((sum, lab) => sum + lab.totalStaff, 0);

    // Get latest metrics for each lab
    const labsWithAnalytics = labs.map(lab => {
      const currentMetric = lab.metrics[0];
      const previousMetric = lab.metrics[1];

      if (!currentMetric) {
        return {
          ...lab,
          alertLevel: 'green' as const,
          anomalies: null,
          percentages: null,
        };
      }

      const percentages = calculateMetricPercentages(currentMetric.practiceRevenue, {
        totalLabExpenses: currentMetric.totalLabExpenses,
        totalLabExpensesWithOutside: currentMetric.totalLabExpensesWithOutside,
        teethSupplies: currentMetric.teethSupplies,
        labSupplies: currentMetric.labSupplies,
        totalPersonnelExpenses: currentMetric.totalPersonnelExpenses,
        overtimeExpenses: currentMetric.overtimeExpenses,
        bonuses: currentMetric.bonuses,
      });

      const anomalies = detectAnomalies(
        {
          hasBacklog: lab.hasBacklog,
          hasOvertime: lab.hasOvertime,
          laborModel: lab.laborModel,
        },
        {
          practiceRevenue: currentMetric.practiceRevenue,
          totalLabExpenses: currentMetric.totalLabExpenses,
          totalPersonnelExpenses: currentMetric.totalPersonnelExpenses,
        },
        previousMetric ? { practiceRevenue: previousMetric.practiceRevenue } : undefined
      );

      const severityScore = calculateSeverityScore(anomalies);
      const alertLevel = getAlertLevel(severityScore);

      return {
        ...lab,
        currentMetric,
        previousMetric,
        percentages,
        anomalies,
        severityScore,
        alertLevel,
      };
    });

    // Calculate aggregate revenue
    const totalRevenue = labsWithAnalytics.reduce(
      (sum, lab) => sum + (lab.currentMetric?.practiceRevenue || 0),
      0
    );

    // Count labs by alert level
    const alertCounts = {
      red: labsWithAnalytics.filter(l => l.alertLevel === 'red').length,
      yellow: labsWithAnalytics.filter(l => l.alertLevel === 'yellow').length,
      green: labsWithAnalytics.filter(l => l.alertLevel === 'green').length,
    };

    res.json({
      summary: {
        totalLabs,
        totalEmployees,
        totalRevenue,
        alertCounts,
      },
      labs: labsWithAnalytics,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get detailed analytics for a specific lab
router.get('/lab/:labId', authenticate, async (req: AuthRequest, res) => {
  try {
    const lab = await prisma.lab.findFirst({
      where: {
        id: req.params.labId,
        userId: req.userId,
      },
      include: {
        employees: {
          orderBy: { hireDate: 'asc' },
        },
        metrics: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    // Calculate metrics with percentages
    const metricsWithPercentages = lab.metrics.map(metric => {
      const percentages = calculateMetricPercentages(metric.practiceRevenue, {
        totalLabExpenses: metric.totalLabExpenses,
        totalLabExpensesWithOutside: metric.totalLabExpensesWithOutside,
        teethSupplies: metric.teethSupplies,
        labSupplies: metric.labSupplies,
        totalPersonnelExpenses: metric.totalPersonnelExpenses,
        overtimeExpenses: metric.overtimeExpenses,
        bonuses: metric.bonuses,
      });

      return {
        ...metric,
        percentages,
      };
    });

    // Detect current anomalies
    const currentMetric = lab.metrics[0];
    const previousMetric = lab.metrics[1];

    let anomalies = null;
    let alertLevel = 'green';

    if (currentMetric) {
      anomalies = detectAnomalies(
        {
          hasBacklog: lab.hasBacklog,
          hasOvertime: lab.hasOvertime,
          laborModel: lab.laborModel,
        },
        {
          practiceRevenue: currentMetric.practiceRevenue,
          totalLabExpenses: currentMetric.totalLabExpenses,
          totalPersonnelExpenses: currentMetric.totalPersonnelExpenses,
        },
        previousMetric ? { practiceRevenue: previousMetric.practiceRevenue } : undefined
      );

      const severityScore = calculateSeverityScore(anomalies);
      alertLevel = getAlertLevel(severityScore);
    }

    res.json({
      lab,
      metrics: metricsWithPercentages,
      anomalies,
      alertLevel,
    });
  } catch (error) {
    console.error('Lab dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch lab dashboard data' });
  }
});

// Get trends (year-over-year, quarter-over-quarter)
router.get('/trends/:labId', authenticate, async (req: AuthRequest, res) => {
  try {
    const lab = await prisma.lab.findFirst({
      where: {
        id: req.params.labId,
        userId: req.userId,
      },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const metrics = await prisma.monthlyMetric.findMany({
      where: { labId: req.params.labId },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    // Calculate month-over-month trends
    const trends = metrics.map((metric, index) => {
      if (index === 0) {
        return { ...metric, trends: null };
      }

      const previous = metrics[index - 1];

      const revenueChange = previous.practiceRevenue
        ? ((metric.practiceRevenue - previous.practiceRevenue) / previous.practiceRevenue) * 100
        : 0;

      const dentureUnitsChange = previous.dentureUnits
        ? ((metric.dentureUnits - previous.dentureUnits) / previous.dentureUnits) * 100
        : 0;

      const patientVolumeChange = previous.patientVolume
        ? ((metric.patientVolume - previous.patientVolume) / previous.patientVolume) * 100
        : 0;

      return {
        ...metric,
        trends: {
          revenueChange,
          dentureUnitsChange,
          patientVolumeChange,
        },
      };
    });

    res.json(trends);
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

export default router;
