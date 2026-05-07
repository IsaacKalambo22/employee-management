import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Search, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const employees = [
  { id: "1", firstName: "John", lastName: "Smith", email: "john.smith@company.com", department: "Human Resources", position: "HR Manager", status: "Active", hireDate: "2023-01-15" },
  { id: "2", firstName: "Jane", lastName: "Doe", email: "jane.doe@company.com", department: "IT Department", position: "IT Manager", status: "Active", hireDate: "2023-02-01" },
  { id: "3", firstName: "Mike", lastName: "Johnson", email: "mike.johnson@company.com", department: "IT Department", position: "Software Developer", status: "Active", hireDate: "2023-03-15" },
  { id: "4", firstName: "Sarah", lastName: "Williams", email: "sarah.williams@company.com", department: "Finance", position: "Accountant", status: "Active", hireDate: "2023-04-01" },
]

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 text-sm mt-1">Manage employee records and information</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Employee List</CardTitle>
              <CardDescription>{employees.length} total employees</CardDescription>
            </div>
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search employees..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    <p className="font-medium text-sm truncate">{employee.firstName} {employee.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">{employee.department}</Badge>
                      <Badge variant="outline" className="text-xs hidden sm:inline-flex">{employee.position}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <div className="hidden sm:flex flex-col items-end">
                    <Badge variant={employee.status === "Active" ? "default" : "secondary"} className="text-xs">
                      {employee.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{employee.hireDate}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 outline-none">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Edit Employee</DropdownMenuItem>
                      <DropdownMenuItem>View Documents</DropdownMenuItem>
                      <DropdownMenuItem>Attendance History</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Terminate</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
