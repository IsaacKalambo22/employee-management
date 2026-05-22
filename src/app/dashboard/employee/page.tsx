import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getEmployeeDashboardAnalytics } from "@/lib/actions/analytics"
import { prisma } from "@/lib/db"
import { Calendar, Clock, FileText, User, DollarSign } from "lucide-react"
import Link from "next/link"

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return <div>Unauthorized</div>
  }

  const analytics = await getEmployeeDashboardAnalytics()

  // Get employee details for profile section
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || !user.employeeId) {
    return <div>Employee not found</div>
  }

  const employee = await prisma.employee.findUnique({
    where: { id: user.employeeId },
    include: {
      department: {
        include: {
          manager: true,
        },
      },
      position: true,
    },
  })

  if (!employee) {
    return <div>Employee not found</div>
  }

  // Get today's attendance
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))

  const todayAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: { gte: startOfDay, lte: endOfDay },
    },
  })

  const attendanceStatus = todayAttendance?.status || "NOT_CLOCKED_IN"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-600">Your personal workspace and information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.leaveBalances.reduce((sum, lb) => sum + lb.remaining, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Days remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${attendanceStatus === "PRESENT" ? "text-green-600" : attendanceStatus === "LATE" ? "text-yellow-600" : attendanceStatus === "ABSENT" ? "text-red-600" : "text-gray-600"}`}>
              {attendanceStatus.replace("_", " ")}
            </div>
            <p className="text-xs text-muted-foreground">
              Today's status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.attendance.presentDays}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.attendance.lateDays} late days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{employee.status}</div>
            <p className="text-xs text-muted-foreground">
              Employment status
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common employee tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/dashboard/leave/new" className="block p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Apply for Leave</p>
                <p className="text-xs text-muted-foreground">Submit leave request</p>
              </Link>
              <Link href="/dashboard/attendance" className="block p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Clock In/Out</p>
                <p className="text-xs text-muted-foreground">Record attendance</p>
              </Link>
              <Link href="/dashboard/requisitions/new" className="block p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Submit Requisition</p>
                <p className="text-xs text-muted-foreground">Request items or services</p>
              </Link>
              <Link href={`/dashboard/employees/${employee.id}/edit`} className="block p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Update Profile</p>
                <p className="text-xs text-muted-foreground">Edit personal information</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your employee details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Employee ID</span>
                <span className="text-sm text-muted-foreground">{employee.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Department</span>
                <span className="text-sm text-muted-foreground">{employee.department?.name || "Not assigned"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Position</span>
                <span className="text-sm text-muted-foreground">{employee.position?.title || "Not assigned"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Manager</span>
                <span className="text-sm text-muted-foreground">{employee.department?.manager ? `${employee.department.manager.firstName} ${employee.department.manager.lastName}` : "Not assigned"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Hire Date</span>
                <span className="text-sm text-muted-foreground">{employee.hireDate.toDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leave Balances</CardTitle>
            <CardDescription>Your available leave days by policy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.leaveBalances.length > 0 ? (
                analytics.leaveBalances.map((balance) => (
                  <div key={balance.policy} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{balance.policy}</p>
                      <p className="text-xs text-muted-foreground">Allocated: {balance.allocated} days</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{balance.remaining}</span>
                      <span className="text-muted-foreground"> / {balance.allocated}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No leave balances found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payslips</CardTitle>
            <CardDescription>Your latest payroll information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentPayslips.length > 0 ? (
                analytics.recentPayslips.map((payslip) => (
                  <div key={payslip.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{payslip.payroll.period}</p>
                      <p className="text-xs text-muted-foreground">{new Date(payslip.createdAt).toDateString()}</p>
                    </div>
                    <div className="text-sm font-medium">
                      MWK {Number(payslip.netPay).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No payslips found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
            <CardDescription>Your latest leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentLeaveRequests.length > 0 ? (
                analytics.recentLeaveRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{request.days} days</p>
                    </div>
                    <div className={`text-sm ${request.status === "APPROVED" ? "text-green-600" : request.status === "PENDING" ? "text-yellow-600" : "text-red-600"}`}>
                      {request.status}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent leave requests</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Requisitions</CardTitle>
            <CardDescription>Your latest requisitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentRequisitions.length > 0 ? (
                analytics.recentRequisitions.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{req.title}</p>
                      <p className="text-xs text-muted-foreground">{req.category}</p>
                    </div>
                    <div className={`text-sm ${req.status === "APPROVED" ? "text-green-600" : req.status === "PENDING" ? "text-yellow-600" : "text-red-600"}`}>
                      {req.status}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent requisitions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
