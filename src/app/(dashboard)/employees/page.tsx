import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data - this will be replaced with database queries
const employees = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@company.com",
    department: "Human Resources",
    position: "HR Manager",
    status: "Active",
    hireDate: "2023-01-15",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@company.com",
    department: "IT Department",
    position: "IT Manager",
    status: "Active",
    hireDate: "2023-02-01",
  },
  {
    id: "3",
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike.johnson@company.com",
    department: "IT Department",
    position: "Software Developer",
    status: "Active",
    hireDate: "2023-03-15",
  },
  {
    id: "4",
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.williams@company.com",
    department: "Finance",
    position: "Accountant",
    status: "Active",
    hireDate: "2023-04-01",
  },
]

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage employee records and information</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee List</CardTitle>
              <CardDescription>
                All employees in the organization
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="pl-8 w-[300px]"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {employee.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary">{employee.department}</Badge>
                      <Badge variant="outline">{employee.position}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Badge variant={employee.status === "Active" ? "default" : "secondary"}>
                      {employee.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hired {employee.hireDate}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
