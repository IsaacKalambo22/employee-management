import { prisma } from "@/lib/db"
import { formatMWK } from "@/lib/payroll/calculations"

// Project budget helpers shared by requisition approval and finance screens.
// A project's available funds are its approved budget less what has been spent.

export async function getProjectRemaining(projectId: string): Promise<number | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.status !== "APPROVED" || project.approvedBudget === null) return null
  return Number(project.approvedBudget) - Number(project.spentAmount)
}

// Returns an error message if the project cannot fund the amount, otherwise null
export async function checkProjectFunds(projectId: string, amount: number): Promise<string | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return "The linked project no longer exists"
  if (project.status !== "APPROVED" || project.approvedBudget === null) {
    return `Project "${project.name}" is not approved for spending`
  }

  const remaining = Number(project.approvedBudget) - Number(project.spentAmount)
  if (amount > remaining) {
    return `Insufficient project funds on "${project.name}". Available: ${formatMWK(remaining)}, Required: ${formatMWK(amount)}`
  }
  return null
}

export async function chargeProject(projectId: string, amount: number) {
  await prisma.project.update({
    where: { id: projectId },
    data: { spentAmount: { increment: amount } },
  })
}

// Department ids a manager may act on: their own department and any they head
export async function getManagedDepartmentIds(employeeId: string | undefined): Promise<string[]> {
  if (!employeeId) return []
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { departmentId: true, managedDepartments: { select: { id: true } } },
  })
  if (!employee) return []
  const ids = new Set(employee.managedDepartments.map((d) => d.id))
  if (employee.departmentId) ids.add(employee.departmentId)
  return [...ids]
}

export function utilizationRate(spent: number, budget: number): number {
  return budget > 0 ? (spent / budget) * 100 : 0
}
