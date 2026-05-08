import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeAnalyticsCards, AttendanceAnalyticsCards, LeaveAnalyticsCards, RequisitionAnalyticsCards } from "@/components/analytics/analytics-cards"
import { AttendanceChart, LeaveChart, DepartmentChart, PayrollChart } from "@/components/analytics/analytics-charts"
import { getEmployeeAnalytics, getAttendanceAnalytics, getLeaveAnalytics, getRequisitionAnalytics, getPayrollAnalytics } from "@/lib/actions/analytics"
import { prisma } from "@/lib/db"
import { Users, Calendar, FileText, Briefcase } from "lucide-react"

export default async function HRDashboard() {
  const [employeeAnalytics, attendanceAnalytics, leaveAnalytics, requisitionAnalytics, payrollAnalytics] = await Promise.all([
    getEmployeeAnalytics(),
    getAttendanceAnalytics(),
    getLeaveAnalytics(),
    getRequisitionAnalytics(),
    getPayrollAnalytics(),
  ])

  const pendingLeave = leaveAnalytics.pending
  const pendingRequisitions = requisitionAnalytics.pending

  // Get department distribution data
  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { employees: true },
      },
    },
  })

  const departmentChartData = departments.map((dept) => ({
    name: dept.name,
    employees: dept._count.employees,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-gray-600">Human Resources management and operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeAnalytics.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {employeeAnalytics.activeEmployees} active employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeave}</div>
            <p className="text-xs text-muted-foreground">
              Pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisitions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequisitions}</div>
            <p className="text-xs text-muted-foreground">
              Pending processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Hires</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeAnalytics.newHiresThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              This month
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
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employees by department</CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentChart data={departmentChartData} />
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
      </div>
    </div>
  )
}
