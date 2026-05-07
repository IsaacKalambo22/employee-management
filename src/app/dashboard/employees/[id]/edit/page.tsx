import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getEmployee, getDepartments, getPositions, updateEmployee } from "@/lib/actions/employees"
import { EmployeeForm } from "@/components/employees/employee-form"

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [employee, departments, positions] = await Promise.all([
    getEmployee(id),
    getDepartments(),
    getPositions(),
  ])

  if (!employee) notFound()

  const action = updateEmployee.bind(null, id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/employees/${id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Profile
        </Link>
      </div>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Edit {employee.firstName} {employee.lastName}
        </h1>
        <p className="text-gray-600 text-sm mt-1">Update employee information</p>
      </div>
      <EmployeeForm
        action={action}
        departments={departments}
        positions={positions}
        defaultValues={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          departmentId: employee.departmentId,
          positionId: employee.positionId,
          hireDate: employee.hireDate,
          status: employee.status,
        }}
        submitLabel="Update Employee"
      />
    </div>
  )
}
