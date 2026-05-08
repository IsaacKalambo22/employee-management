import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeAnalyticsCards, AttendanceAnalyticsCards, LeaveAnalyticsCards, RequisitionAnalyticsCards, PayrollAnalyticsCards } from "@/components/analytics/analytics-cards"
import { getEmployeeAnalytics, getAttendanceAnalytics, getLeaveAnalytics, getRequisitionAnalytics, getPayrollAnalytics } from "@/lib/actions/analytics"
import { prisma } from "@/lib/db"
import { Users, Settings, Database, Shield, FileText } from "lucide-react"

export default async function AdminDashboard() {
  const [employeeAnalytics, attendanceAnalytics, leaveAnalytics, requisitionAnalytics, payrollAnalytics] = await Promise.all([
    getEmployeeAnalytics(),
    getAttendanceAnalytics(),
    getLeaveAnalytics(),
    getRequisitionAnalytics(),
    getPayrollAnalytics(),
  ])

  const totalUsers = await prisma.user.count()
  const totalDepartments = await prisma.department.count()
  const totalPositions = await prisma.position.count()
  const pendingApprovals = leaveAnalytics.pending + requisitionAnalytics.pending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">System administration and management</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              System users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositions}</div>
            <p className="text-xs text-muted-foreground">
              Job positions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Employee Analytics</CardTitle>
            <CardDescription>Employee statistics and distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeAnalyticsCards analytics={employeeAnalytics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Analytics</CardTitle>
            <CardDescription>Attendance statistics for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceAnalyticsCards analytics={attendanceAnalytics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Analytics</CardTitle>
            <CardDescription>Leave request statistics for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveAnalyticsCards analytics={leaveAnalytics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requisition Analytics</CardTitle>
            <CardDescription>Requisition statistics for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <RequisitionAnalyticsCards analytics={requisitionAnalytics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Analytics</CardTitle>
            <CardDescription>Payroll statistics for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <PayrollAnalyticsCards analytics={payrollAnalytics} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
