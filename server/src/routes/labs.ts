import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const labSchema = z.object({
  officeId: z.string(),
  city: z.string(),
  state: z.string(),
  practiceModel: z.enum(['PO', 'PLLC']),
  address: z.string(),
  phone: z.string(),
  managingDentist: z.string(),
  directorFieldOps: z.string(),
  standardizationStatus: z.enum(['Training Plan', 'Graduated']),
  hasBacklog: z.boolean().optional().default(false),
  hasOvertime: z.boolean().optional().default(false),
  laborModel: z.number().optional().default(0),
  standardizationComplete: z.boolean().optional().default(false),
  labManagerName: z.string().optional(),
  labManagerEmail: z.string().optional(),
  labManagerPhone: z.string().optional(),
  totalStaff: z.number().optional().default(0),
  countLabManagers: z.number().optional().default(0),
  countFullTechs: z.number().optional().default(0),
  countWaxerFinishers: z.number().optional().default(0),
  countProcessors: z.number().optional().default(0),
});

// Get all labs for authenticated user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const labs = await prisma.lab.findMany({
      where: { userId: req.userId },
      include: {
        employees: true,
        metrics: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12, // Last 12 months
        },
      },
      orderBy: { city: 'asc' },
    });

    res.json(labs);
  } catch (error) {
    console.error('Get labs error:', error);
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

// Get single lab
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const lab = await prisma.lab.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        employees: {
          orderBy: { name: 'asc' },
        },
        metrics: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    res.json(lab);
  } catch (error) {
    console.error('Get lab error:', error);
    res.status(500).json({ error: 'Failed to fetch lab' });
  }
});

// Create lab
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = labSchema.parse(req.body);

    const lab = await prisma.lab.create({
      data: {
        ...data,
        userId: req.userId!,
      },
      include: {
        employees: true,
        metrics: true,
      },
    });

    res.status(201).json(lab);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create lab error:', error);
    res.status(500).json({ error: 'Failed to create lab' });
  }
});

// Update lab
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = labSchema.partial().parse(req.body);

    const lab = await prisma.lab.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const updated = await prisma.lab.update({
      where: { id: req.params.id },
      data,
      include: {
        employees: true,
        metrics: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12,
        },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update lab error:', error);
    res.status(500).json({ error: 'Failed to update lab' });
  }
});

// Delete lab
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const lab = await prisma.lab.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    await prisma.lab.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Lab deleted successfully' });
  } catch (error) {
    console.error('Delete lab error:', error);
    res.status(500).json({ error: 'Failed to delete lab' });
  }
});

export default router;
