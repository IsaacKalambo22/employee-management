import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Calendar, Clock, FileText, User } from "lucide-react"
import Link from "next/link"

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return <div>Unauthorized</div>
  }

  // Get the current user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || !user.employeeId) {
    return <div>Employee not found</div>
  }

  // Get employee with all relations
  const employee = await prisma.employee.findUnique({
    where: { id: user.employeeId },
    include: {
      department: {
        include: {
          manager: true,
        },
      },
      position: true,
      leaveBalances: {
        where: { year: new Date().getFullYear() },
        include: { policy: true },
      },
    },
  })

  if (!employee) {
    return <div>Employee not found</div>
  }

  // Calculate total leave balance
  const totalLeaveBalance = employee.leaveBalances.reduce((sum, balance) => sum + (balance.allocated - balance.used), 0)

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

  // Get pending leave requests
  const pendingLeaveRequests = await prisma.leaveRequest.count({
    where: {
      employeeId: employee.id,
      status: "PENDING",
    },
  })

  // Get pending requisitions
  const pendingRequisitions = await prisma.requisition.count({
    where: {
      employeeId: employee.id,
      status: "PENDING",
    },
  })

  const totalPending = pendingLeaveRequests + pendingRequisitions

  // Get recent leave requests
  const recentLeaveRequests = await prisma.leaveRequest.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  })

  // Get recent payslips
  const recentPayslips = await prisma.payslip.findMany({
    where: { employeeId: employee.id },
    include: { payroll: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  })

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
            <div className="text-2xl font-bold">{totalLeaveBalance}</div>
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
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
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
              {employee.leaveBalances.length > 0 ? (
                employee.leaveBalances.map((balance) => (
                  <div key={balance.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{balance.policy.name}</p>
                      <p className="text-xs text-muted-foreground">Year: {balance.year}</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{balance.allocated - balance.used}</span>
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
              {recentPayslips.length > 0 ? (
                recentPayslips.map((payslip) => (
                  <div key={payslip.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{payslip.payroll.period}</p>
                      <p className="text-xs text-muted-foreground">{payslip.createdAt.toDateString()}</p>
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
    </div>
  )
}
