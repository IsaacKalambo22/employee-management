import pkg from '@prisma/client'
const { PrismaClient } = pkg
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Check if default users already exist
  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@company.com', 'john.smith@company.com', 'jane.doe@company.com', 'mike.johnson@company.com', 'sarah.williams@company.com']
      }
    }
  })

  if (existingUsers.length > 0) {
    console.log('✅ Database already seeded with default users. Skipping seed.')
    console.log(`   Found ${existingUsers.length} existing default users:`)
    existingUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`)
    })
    return
  }

  console.log('📊 Seeding departments...')
  const hrDept = await prisma.department.create({ data: { name: 'Human Resources', description: 'HR Department' } })
  const itDept = await prisma.department.create({ data: { name: 'IT Department', description: 'Information Technology' } })
  const financeDept = await prisma.department.create({ data: { name: 'Finance', description: 'Finance and Accounting' } })

  console.log('📊 Seeding positions...')
  const hrManagerPos = await prisma.position.create({ data: { title: 'HR Manager', level: 'Senior', department: 'Human Resources' } })
  const itManagerPos = await prisma.position.create({ data: { title: 'IT Manager', level: 'Senior', department: 'IT Department' } })
  const developerPos = await prisma.position.create({ data: { title: 'Software Developer', level: 'Mid', department: 'IT Department' } })
  const accountantPos = await prisma.position.create({ data: { title: 'Accountant', level: 'Mid', department: 'Finance' } })

  console.log('👥 Seeding employees...')
  const hrManager = await prisma.employee.create({ data: { firstName: 'John', lastName: 'Smith', email: 'john.smith@company.com', phone: '+1234567890', hireDate: new Date('2023-01-15'), departmentId: hrDept.id, positionId: hrManagerPos.id } })
  const itManager = await prisma.employee.create({ data: { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@company.com', phone: '+1234567891', hireDate: new Date('2023-02-01'), departmentId: itDept.id, positionId: itManagerPos.id } })
  const developer = await prisma.employee.create({ data: { firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@company.com', phone: '+1234567892', hireDate: new Date('2023-03-15'), departmentId: itDept.id, positionId: developerPos.id } })
  const accountant = await prisma.employee.create({ data: { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@company.com', phone: '+1234567893', hireDate: new Date('2023-04-01'), departmentId: financeDept.id, positionId: accountantPos.id } })

  await prisma.department.update({ where: { id: hrDept.id }, data: { managerId: hrManager.id } })
  await prisma.department.update({ where: { id: itDept.id }, data: { managerId: itManager.id } })
  await prisma.department.update({ where: { id: financeDept.id }, data: { managerId: accountant.id } })

  console.log('🔐 Seeding users...')
  const hashedPassword = await bcrypt.hash('password123', 10)
  await prisma.user.create({ data: { email: 'admin@company.com', password: hashedPassword, role: 'SUPER_ADMIN' } })
  await prisma.user.create({ data: { email: 'john.smith@company.com', password: hashedPassword, role: 'HR_ADMIN', employeeId: hrManager.id } })
  await prisma.user.create({ data: { email: 'jane.doe@company.com', password: hashedPassword, role: 'MANAGER', employeeId: itManager.id } })
  await prisma.user.create({ data: { email: 'mike.johnson@company.com', password: hashedPassword, role: 'EMPLOYEE', employeeId: developer.id } })
  await prisma.user.create({ data: { email: 'sarah.williams@company.com', password: hashedPassword, role: 'FINANCE_OFFICER', employeeId: accountant.id } })

  console.log('📞 Seeding emergency contacts...')
  await prisma.emergencyContact.create({ data: { employeeId: hrManager.id, name: 'Mary Smith', relationship: 'Spouse', phone: '+1234567894', isPrimary: true } })
  await prisma.emergencyContact.create({ data: { employeeId: itManager.id, name: 'Bob Doe', relationship: 'Partner', phone: '+1234567895', isPrimary: true } })

  console.log('🏖️  Seeding leave policies...')
  const annualLeave = await prisma.leavePolicy.create({ data: { name: 'Annual Leave', description: 'Paid annual leave', daysPerYear: 21, carryOver: true, maxCarryOver: 5 } })
  const sickLeave = await prisma.leavePolicy.create({ data: { name: 'Sick Leave', description: 'Medical sick leave', daysPerYear: 10, carryOver: false } })
  const maternityLeave = await prisma.leavePolicy.create({ data: { name: 'Maternity Leave', description: 'Paid maternity leave', daysPerYear: 90, carryOver: false } })
  const paternityLeave = await prisma.leavePolicy.create({ data: { name: 'Paternity Leave', description: 'Paid paternity leave', daysPerYear: 14, carryOver: false } })
  const compassionateLeave = await prisma.leavePolicy.create({ data: { name: 'Compassionate Leave', description: 'Bereavement and compassionate leave', daysPerYear: 5, carryOver: false } })
  const studyLeave = await prisma.leavePolicy.create({ data: { name: 'Study Leave', description: 'Leave for examinations and study', daysPerYear: 10, carryOver: false } })
  const unpaidLeave = await prisma.leavePolicy.create({ data: { name: 'Unpaid Leave', description: 'Unpaid extended leave', daysPerYear: 30, carryOver: false } })

  console.log('📅 Seeding leave balances...')
  const allEmployees = [hrManager, itManager, developer, accountant]
  const currentYear = new Date().getFullYear()
  const allPolicies = [annualLeave, sickLeave, maternityLeave, paternityLeave, compassionateLeave, studyLeave, unpaidLeave]
  for (const emp of allEmployees) {
    await prisma.leaveBalance.createMany({
      data: allPolicies.map(policy => ({
        employeeId: emp.id,
        policyId: policy.id,
        year: currentYear,
        allocated: policy.daysPerYear,
        used: 0,
        pending: 0,
        carriedOver: 0,
      })),
      skipDuplicates: true,
    })
  }

  console.log('💰 Seeding salaries...')
  const salaries = [
    { employeeId: hrManager.id, baseSalary: 1200000, allowance: 150000 },
    { employeeId: itManager.id, baseSalary: 1350000, allowance: 150000 },
    { employeeId: developer.id, baseSalary: 850000, allowance: 75000 },
    { employeeId: accountant.id, baseSalary: 900000, allowance: 75000 },
  ]
  for (const salary of salaries) {
    await prisma.salary.create({ data: salary })
  }

  console.log('📁 Seeding department projects...')
  await prisma.project.create({ data: { departmentId: itDept.id, name: 'Network Infrastructure Upgrade', description: 'Replace core switches and upgrade office Wi-Fi to support growing headcount.', fiscalYear: currentYear, proposedBudget: 12000000, approvedBudget: 10000000, status: 'APPROVED', proposedById: itManager.id, reviewedAt: new Date() } })
  await prisma.project.create({ data: { departmentId: itDept.id, name: 'HR System Phase 2', description: 'Extend the HR system with self-service payroll, loans and finance reporting.', fiscalYear: currentYear, proposedBudget: 6500000, proposedById: itManager.id } })
  await prisma.project.create({ data: { departmentId: hrDept.id, name: 'Staff Training Programme', description: 'Annual leadership and compliance training for all staff across departments.', fiscalYear: currentYear, proposedBudget: 4000000, approvedBudget: 4000000, status: 'APPROVED', proposedById: hrManager.id, reviewedAt: new Date() } })

  console.log('✅ Database seeded successfully!')
  console.log('\n📋 Default login credentials:')
  console.log('   SUPER_ADMIN: admin@company.com / password123')
  console.log('   HR_ADMIN: john.smith@company.com / password123')
  console.log('   MANAGER: jane.doe@company.com / password123')
  console.log('   EMPLOYEE: mike.johnson@company.com / password123')
  console.log('   FINANCE_OFFICER: sarah.williams@company.com / password123')
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
