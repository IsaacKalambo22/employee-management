import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { getEmployees, getDepartments } from "@/lib/actions/employees"
import { EmployeeSearch } from "@/components/employees/employee-search"
import { EmployeeActions } from "@/components/employees/employee-actions"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  TERMINATED: "destructive",
  ON_LEAVE: "outline",
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; departmentId?: string }>
}) {
  const params = await searchParams
  const [employees, departments] = await Promise.all([
    getEmployees(params.search, params.departmentId),
    getDepartments(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 text-sm mt-1">Manage employee records and information</p>
        </div>
        <Link href="/dashboard/employees/new" className={cn(buttonVariants({ size: "sm" }), "inline-flex items-center")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Link>
      </div>

      <EmployeeSearch departments={departments} />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Employee List</CardTitle>
          <CardDescription>{employees.length} employee{employees.length !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No employees found</p>
              <p className="text-xs mt-1">Try adjusting your search or add a new employee</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link href={`/dashboard/employees/${employee.id}`}>
                        <p className="font-medium text-sm truncate hover:text-blue-600 transition-colors">
                          {employee.firstName} {employee.lastName}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{employee.email ?? "No email"}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {employee.department && (
                          <Badge variant="secondary" className="text-xs">{employee.department.name}</Badge>
                        )}
                        {employee.position && (
                          <Badge variant="outline" className="text-xs hidden sm:inline-flex">{employee.position.title}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="hidden sm:flex flex-col items-end">
                      <Badge variant={statusVariant[employee.status] ?? "secondary"} className="text-xs">
                        {employee.status.replace("_", " ")}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(employee.hireDate).toLocaleDateString()}
                      </p>
                    </div>
                    <EmployeeActions employeeId={employee.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
