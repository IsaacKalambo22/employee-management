import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getDepartments, getPositions, createEmployee } from "@/lib/actions/employees"
import { EmployeeForm } from "@/components/employees/employee-form"

export default async function NewEmployeePage() {
  const [departments, positions] = await Promise.all([getDepartments(), getPositions()])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Employees
        </Link>
      </div>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add Employee</h1>
        <p className="text-gray-600 text-sm mt-1">Create a new employee record</p>
      </div>
      <EmployeeForm
        action={createEmployee}
        departments={departments}
        positions={positions}
        submitLabel="Create Employee"
      />
    </div>
  )
}
