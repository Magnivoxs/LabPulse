import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const metricSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  dentureUnits: z.number().optional().default(0),
  patientVolume: z.number().optional().default(0),
  practiceRevenue: z.number().optional().default(0),
  totalLabExpenses: z.number().optional().default(0),
  teethSupplies: z.number().optional().default(0),
  labSupplies: z.number().optional().default(0),
  totalLabExpensesWithOutside: z.number().optional().default(0),
  totalPersonnelExpenses: z.number().optional().default(0),
  overtimeExpenses: z.number().optional().default(0),
  bonuses: z.number().optional().default(0),
  hadBacklog: z.boolean().optional().default(false),
  hadOvertime: z.boolean().optional().default(false),
  labId: z.string(),
});

// Get all metrics for a lab
router.get('/lab/:labId', authenticate, async (req: AuthRequest, res) => {
  try {
    // Verify user owns the lab
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
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    res.json(metrics);
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get metrics for a specific period
router.get('/lab/:labId/:year/:month', authenticate, async (req: AuthRequest, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    // Verify user owns the lab
    const lab = await prisma.lab.findFirst({
      where: {
        id: req.params.labId,
        userId: req.userId,
      },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const metric = await prisma.monthlyMetric.findUnique({
      where: {
        labId_month_year: {
          labId: req.params.labId,
          month,
          year,
        },
      },
    });

    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }

    res.json(metric);
  } catch (error) {
    console.error('Get metric error:', error);
    res.status(500).json({ error: 'Failed to fetch metric' });
  }
});

// Create or update metric
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = metricSchema.parse(req.body);

    // Verify user owns the lab
    const lab = await prisma.lab.findFirst({
      where: {
        id: data.labId,
        userId: req.userId,
      },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    // Upsert (create or update)
    const metric = await prisma.monthlyMetric.upsert({
      where: {
        labId_month_year: {
          labId: data.labId,
          month: data.month,
          year: data.year,
        },
      },
      update: data,
      create: data,
    });

    res.status(201).json(metric);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create/update metric error:', error);
    res.status(500).json({ error: 'Failed to save metric' });
  }
});

// Delete metric
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const metric = await prisma.monthlyMetric.findUnique({
      where: { id: req.params.id },
      include: { lab: true },
    });

    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }

    if (metric.lab.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.monthlyMetric.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Metric deleted successfully' });
  } catch (error) {
    console.error('Delete metric error:', error);
    res.status(500).json({ error: 'Failed to delete metric' });
  }
});

export default router;
