import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const employeeSchema = z.object({
  name: z.string(),
  position: z.enum(['Lab Manager', 'Full Tech', 'Waxer Finisher', 'Processor']),
  hireDate: z.string().transform(str => new Date(str)),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  labId: z.string(),
});

// Get all employees for a lab
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

    const employees = await prisma.employee.findMany({
      where: { labId: req.params.labId },
      orderBy: { name: 'asc' },
    });

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Create employee
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = employeeSchema.parse(req.body);

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

    const employee = await prisma.employee.create({
      data,
    });

    // Update lab staff counts
    await updateLabStaffCounts(data.labId);

    res.status(201).json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update employee
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = employeeSchema.partial().omit({ labId: true }).parse(req.body);

    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: { lab: true },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (employee.lab.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data,
    });

    // Update lab staff counts
    await updateLabStaffCounts(employee.labId);

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: { lab: true },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (employee.lab.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.employee.delete({
      where: { id: req.params.id },
    });

    // Update lab staff counts
    await updateLabStaffCounts(employee.labId);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Helper function to update lab staff counts
async function updateLabStaffCounts(labId: string) {
  const employees = await prisma.employee.findMany({
    where: { labId },
  });

  const counts = {
    totalStaff: employees.length,
    countLabManagers: employees.filter(e => e.position === 'Lab Manager').length,
    countFullTechs: employees.filter(e => e.position === 'Full Tech').length,
    countWaxerFinishers: employees.filter(e => e.position === 'Waxer Finisher').length,
    countProcessors: employees.filter(e => e.position === 'Processor').length,
  };

  await prisma.lab.update({
    where: { id: labId },
    data: counts,
  });
}

export default router;
