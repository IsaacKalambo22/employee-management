import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hrDept = await prisma.department.create({ data: { name: 'Human Resources', description: 'HR Department' } })
  const itDept = await prisma.department.create({ data: { name: 'IT Department', description: 'Information Technology' } })
  const financeDept = await prisma.department.create({ data: { name: 'Finance', description: 'Finance and Accounting' } })

  const hrManagerPos = await prisma.position.create({ data: { title: 'HR Manager', level: 'Senior', department: 'Human Resources' } })
  const itManagerPos = await prisma.position.create({ data: { title: 'IT Manager', level: 'Senior', department: 'IT Department' } })
  const developerPos = await prisma.position.create({ data: { title: 'Software Developer', level: 'Mid', department: 'IT Department' } })
  const accountantPos = await prisma.position.create({ data: { title: 'Accountant', level: 'Mid', department: 'Finance' } })

  const hrManager = await prisma.employee.create({ data: { firstName: 'John', lastName: 'Smith', email: 'john.smith@company.com', phone: '+1234567890', hireDate: new Date('2023-01-15'), departmentId: hrDept.id, positionId: hrManagerPos.id } })
  const itManager = await prisma.employee.create({ data: { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@company.com', phone: '+1234567891', hireDate: new Date('2023-02-01'), departmentId: itDept.id, positionId: itManagerPos.id } })
  const developer = await prisma.employee.create({ data: { firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@company.com', phone: '+1234567892', hireDate: new Date('2023-03-15'), departmentId: itDept.id, positionId: developerPos.id } })
  const accountant = await prisma.employee.create({ data: { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@company.com', phone: '+1234567893', hireDate: new Date('2023-04-01'), departmentId: financeDept.id, positionId: accountantPos.id } })

  await prisma.department.update({ where: { id: hrDept.id }, data: { managerId: hrManager.id } })
  await prisma.department.update({ where: { id: itDept.id }, data: { managerId: itManager.id } })
  await prisma.department.update({ where: { id: financeDept.id }, data: { managerId: accountant.id } })

  const hashedPassword = await bcrypt.hash('password123', 10)
  await prisma.user.create({ data: { email: 'admin@company.com', password: hashedPassword, role: 'SUPER_ADMIN' } })
  await prisma.user.create({ data: { email: 'john.smith@company.com', password: hashedPassword, role: 'HR_ADMIN', employeeId: hrManager.id } })
  await prisma.user.create({ data: { email: 'jane.doe@company.com', password: hashedPassword, role: 'MANAGER', employeeId: itManager.id } })
  await prisma.user.create({ data: { email: 'mike.johnson@company.com', password: hashedPassword, role: 'EMPLOYEE', employeeId: developer.id } })
  await prisma.user.create({ data: { email: 'sarah.williams@company.com', password: hashedPassword, role: 'MANAGER', employeeId: accountant.id } })

  await prisma.emergencyContact.create({ data: { employeeId: hrManager.id, name: 'Mary Smith', relationship: 'Spouse', phone: '+1234567894', isPrimary: true } })
  await prisma.emergencyContact.create({ data: { employeeId: itManager.id, name: 'Bob Doe', relationship: 'Partner', phone: '+1234567895', isPrimary: true } })

  const annualLeave = await prisma.leavePolicy.create({ data: { name: 'Annual Leave', description: 'Paid annual leave', daysPerYear: 21, carryOver: true, maxCarryOver: 5 } })
  const sickLeave = await prisma.leavePolicy.create({ data: { name: 'Sick Leave', description: 'Medical sick leave', daysPerYear: 10, carryOver: false } })
  const maternityLeave = await prisma.leavePolicy.create({ data: { name: 'Maternity Leave', description: 'Maternity/Paternity leave', daysPerYear: 90, carryOver: false } })

  const allEmployees = [hrManager, itManager, developer, accountant]
  const currentYear = new Date().getFullYear()
  for (const emp of allEmployees) {
    await prisma.leaveBalance.createMany({
      data: [
        { employeeId: emp.id, policyId: annualLeave.id, year: currentYear, allocated: 21 },
        { employeeId: emp.id, policyId: sickLeave.id, year: currentYear, allocated: 10 },
        { employeeId: emp.id, policyId: maternityLeave.id, year: currentYear, allocated: 90 },
      ],
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
