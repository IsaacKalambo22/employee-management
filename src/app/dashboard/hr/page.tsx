import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeAnalyticsCards, AttendanceAnalyticsCards, LeaveAnalyticsCards, RequisitionAnalyticsCards } from "@/components/analytics/analytics-cards"
import { AttendanceChart, LeaveChart, DepartmentChart, PayrollChart } from "@/components/analytics/analytics-charts"
import { getHRDashboardAnalytics } from "@/lib/actions/analytics"
import { prisma } from "@/lib/db"
import { Users, Calendar, FileText, Briefcase, Workflow, DollarSign, Clock } from "lucide-react"

export default async function HRDashboard() {
  const analytics = await getHRDashboardAnalytics()

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
            <div className="text-2xl font-bold">{analytics.employee.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.employee.activeEmployees} active employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.pendingActions.leaveRequests + analytics.pendingActions.requisitions}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.pendingActions.leaveRequests} leave, {analytics.pendingActions.requisitions} requisitions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.workflow.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.workflow.completedWorkflows} completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.budget.utilizationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.budget.totalAllocated.toLocaleString()} allocated
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
            <EmployeeAnalyticsCards analytics={analytics.employee} />
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
            <AttendanceAnalyticsCards analytics={analytics.attendance} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Analytics</CardTitle>
            <CardDescription>Leave request statistics for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveAnalyticsCards analytics={analytics.leave} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requisition Analytics</CardTitle>
            <CardDescription>Requisition statistics for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <RequisitionAnalyticsCards analytics={analytics.requisition} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Analytics</CardTitle>
            <CardDescription>Workflow performance and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analytics.workflow.activeWorkflows}</div>
                <div className="text-sm text-gray-600">Active Workflows</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analytics.workflow.completedWorkflows}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{analytics.workflow.avgCompletionTime}h</div>
                <div className="text-sm text-gray-600">Avg Completion Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Department budget utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.budget.budgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{budget.department} - {budget.category}</span>
                    <span className="text-gray-600">{budget.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(budget.utilizationRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Spent: {budget.spent.toLocaleString()}</span>
                    <span>Remaining: {budget.remaining.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
