import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@labpulse.com' },
    update: {},
    create: {
      email: 'demo@labpulse.com',
      password: hashedPassword,
      name: 'Demo Executive',
      role: 'executive',
    },
  });

  console.log('✅ Created demo user: demo@labpulse.com / demo123');

  // Create sample labs
  const labs = [
    {
      officeId: '101',
      city: 'Phoenix',
      state: 'AZ',
      practiceModel: 'PO',
      address: '1234 Desert Rd, Phoenix, AZ 85001',
      phone: '(602) 555-0101',
      managingDentist: 'Dr. Sarah Johnson',
      directorFieldOps: 'Michael Chen',
      standardizationStatus: 'Graduated',
      hasBacklog: false,
      hasOvertime: false,
      laborModel: 0,
      standardizationComplete: true,
      labManagerName: 'Jennifer Martinez',
      labManagerEmail: 'j.martinez@labpulse.com',
      labManagerPhone: '(602) 555-0102',
      totalStaff: 5,
      countLabManagers: 1,
      countFullTechs: 2,
      countWaxerFinishers: 1,
      countProcessors: 1,
    },
    {
      officeId: '102',
      city: 'Scottsdale',
      state: 'AZ',
      practiceModel: 'PLLC',
      address: '5678 Valley View Dr, Scottsdale, AZ 85254',
      phone: '(480) 555-0201',
      managingDentist: 'Dr. Robert Williams',
      directorFieldOps: 'Michael Chen',
      standardizationStatus: 'Training Plan',
      hasBacklog: true,
      hasOvertime: true,
      laborModel: -1.5,
      standardizationComplete: false,
      labManagerName: 'David Thompson',
      labManagerEmail: 'd.thompson@labpulse.com',
      labManagerPhone: '(480) 555-0202',
      totalStaff: 3,
      countLabManagers: 1,
      countFullTechs: 1,
      countWaxerFinishers: 1,
      countProcessors: 0,
    },
    {
      officeId: '103',
      city: 'Tucson',
      state: 'AZ',
      practiceModel: 'PO',
      address: '910 Mountain Ave, Tucson, AZ 85701',
      phone: '(520) 555-0301',
      managingDentist: 'Dr. Emily Davis',
      directorFieldOps: 'Lisa Anderson',
      standardizationStatus: 'Graduated',
      hasBacklog: false,
      hasOvertime: false,
      laborModel: 0.5,
      standardizationComplete: true,
      labManagerName: 'Carlos Rodriguez',
      labManagerEmail: 'c.rodriguez@labpulse.com',
      labManagerPhone: '(520) 555-0302',
      totalStaff: 6,
      countLabManagers: 1,
      countFullTechs: 3,
      countWaxerFinishers: 1,
      countProcessors: 1,
    },
    {
      officeId: '104',
      city: 'Mesa',
      state: 'AZ',
      practiceModel: 'PLLC',
      address: '1122 East Main St, Mesa, AZ 85201',
      phone: '(480) 555-0401',
      managingDentist: 'Dr. James Wilson',
      directorFieldOps: 'Lisa Anderson',
      standardizationStatus: 'Training Plan',
      hasBacklog: false,
      hasOvertime: true,
      laborModel: 1.2,
      standardizationComplete: false,
      labManagerName: 'Patricia Lee',
      labManagerEmail: 'p.lee@labpulse.com',
      labManagerPhone: '(480) 555-0402',
      totalStaff: 7,
      countLabManagers: 1,
      countFullTechs: 3,
      countWaxerFinishers: 2,
      countProcessors: 1,
    },
  ];

  for (const labData of labs) {
    const lab = await prisma.lab.create({
      data: {
        ...labData,
        userId: user.id,
      } as any,
    });

    console.log(`✅ Created lab: ${lab.city}, ${lab.state}`);

    // Add employees for each lab
    const employeesData = generateEmployees(lab.id, labData);
    for (const empData of employeesData) {
      await prisma.employee.create({ data: empData });
    }

    // Add monthly metrics (last 12 months)
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const metrics = generateMetrics(lab.id, month, year, labData.officeId);
      await prisma.monthlyMetric.create({ data: metrics });
    }

    console.log(`  ✅ Added ${employeesData.length} employees and 12 months of metrics`);
  }

  console.log('🎉 Seeding completed!');
}

function generateEmployees(labId: string, labData: any) {
  const employees = [];
  const baseDate = new Date();

  // Lab Manager
  if (labData.countLabManagers > 0) {
    employees.push({
      name: labData.labManagerName,
      position: 'Lab Manager',
      hireDate: new Date(baseDate.getFullYear() - 3, 2, 15),
      email: labData.labManagerEmail,
      phone: labData.labManagerPhone,
      labId,
    });
  }

  // Full Techs
  const techNames = ['Alex Johnson', 'Sam Peters', 'Jordan Lee'];
  for (let i = 0; i < labData.countFullTechs; i++) {
    employees.push({
      name: techNames[i] || `Tech ${i + 1}`,
      position: 'Full Tech',
      hireDate: new Date(baseDate.getFullYear() - Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 1),
      labId,
    });
  }

  // Waxer Finishers
  const waxerNames = ['Maria Garcia', 'John Smith'];
  for (let i = 0; i < labData.countWaxerFinishers; i++) {
    employees.push({
      name: waxerNames[i] || `Waxer ${i + 1}`,
      position: 'Waxer Finisher',
      hireDate: new Date(baseDate.getFullYear() - Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1),
      labId,
    });
  }

  // Processors
  const processorNames = ['Chris Taylor'];
  for (let i = 0; i < labData.countProcessors; i++) {
    employees.push({
      name: processorNames[i] || `Processor ${i + 1}`,
      position: 'Processor',
      hireDate: new Date(baseDate.getFullYear() - Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), 1),
      labId,
    });
  }

  return employees;
}

function generateMetrics(labId: string, month: number, year: number, officeId: string) {
  // Base values that vary by office
  const officeMultipliers: { [key: string]: number } = {
    '101': 1.0,
    '102': 0.8,
    '103': 1.2,
    '104': 1.1,
  };

  const multiplier = officeMultipliers[officeId] || 1.0;

  // Add some randomness and seasonal variation
  const seasonalFactor = 1 + (Math.sin((month / 12) * 2 * Math.PI) * 0.1);
  const randomFactor = 0.9 + Math.random() * 0.2;
  const factor = multiplier * seasonalFactor * randomFactor;

  // Base monthly values
  const baseRevenue = 250000;
  const baseDentures = 120;
  const basePatients = 200;

  const practiceRevenue = baseRevenue * factor;
  const dentureUnits = Math.floor(baseDentures * factor);
  const patientVolume = Math.floor(basePatients * factor);

  // Calculate expenses as percentages of revenue
  // Office 102 has higher expenses (struggling lab)
  const expenseMultiplier = officeId === '102' ? 1.3 : 1.0;

  const totalLabExpenses = practiceRevenue * (0.11 * expenseMultiplier);
  const teethSupplies = practiceRevenue * 0.04;
  const labSupplies = practiceRevenue * 0.03;
  const totalLabExpensesWithOutside = totalLabExpenses + (practiceRevenue * 0.02);
  const totalPersonnelExpenses = practiceRevenue * (0.06 * expenseMultiplier);
  const overtimeExpenses = officeId === '102' || officeId === '104' ? practiceRevenue * 0.015 : practiceRevenue * 0.005;
  const bonuses = practiceRevenue * 0.01;

  return {
    labId,
    month,
    year,
    dentureUnits,
    patientVolume,
    practiceRevenue: Math.round(practiceRevenue),
    totalLabExpenses: Math.round(totalLabExpenses),
    teethSupplies: Math.round(teethSupplies),
    labSupplies: Math.round(labSupplies),
    totalLabExpensesWithOutside: Math.round(totalLabExpensesWithOutside),
    totalPersonnelExpenses: Math.round(totalPersonnelExpenses),
    overtimeExpenses: Math.round(overtimeExpenses),
    bonuses: Math.round(bonuses),
    hadBacklog: officeId === '102',
    hadOvertime: officeId === '102' || officeId === '104',
  };
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
