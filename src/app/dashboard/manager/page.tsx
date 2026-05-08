import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Users, Calendar, FileText, TrendingUp, Clock } from "lucide-react"

export default async function ManagerDashboard() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return <div>Unauthorized</div>
  }

  // Get the current user with employee and department relations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  })

  if (!user || !user.employee) {
    return <div>Employee not found</div>
  }

  const employee = user.employee

  // Get team members (employees in the same department, excluding the manager)
  const teamMembers = await prisma.employee.findMany({
    where: {
      departmentId: employee.departmentId,
      id: { not: employee.id },
      status: "ACTIVE",
    },
    include: {
      department: true,
      position: true,
    },
  })

  // Get pending leave approvals for this manager
  const pendingLeaveApprovals = await prisma.leaveApproval.count({
    where: {
      approverId: userId,
      status: "PENDING",
    },
  })

  // Get pending requisition approvals for this manager
  const pendingRequisitionApprovals = await prisma.requisitionApproval.count({
    where: {
      approverId: userId,
      status: "PENDING",
    },
  })

  const totalPendingApprovals = pendingLeaveApprovals + pendingRequisitionApprovals

  // Get team attendance for today
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))

  const teamAttendance = await prisma.attendance.findMany({
    where: {
      employeeId: { in: teamMembers.map((m) => m.id) },
      date: { gte: startOfDay, lte: endOfDay },
    },
  })

  const presentToday = teamAttendance.filter((a: any) => a.status === "PRESENT").length
  const attendanceRate = teamMembers.length > 0 ? (presentToday / teamMembers.length) * 100 : 0

  // Get recent leave requests from team
  const recentLeaveRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: teamMembers.map((m) => m.id) },
    },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  // Get recent requisitions from team
  const recentRequisitions = await prisma.requisition.findMany({
    where: {
      employeeId: { in: teamMembers.map((m) => m.id) },
    },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600">Team management and oversight</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Direct reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Present today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.department?.name || "Not assigned"}</div>
            <p className="text-xs text-muted-foreground">
              Your team
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Manage your team and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Leave Approvals ({pendingLeaveApprovals} pending)</p>
                <p className="text-xs text-muted-foreground">Review and approve leave requests</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Requisition Reviews ({pendingRequisitionApprovals} pending)</p>
                <p className="text-xs text-muted-foreground">Process team requisitions</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Team Performance</p>
                <p className="text-xs text-muted-foreground">View team metrics and KPIs</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Team Schedule</p>
                <p className="text-xs text-muted-foreground">Manage team work schedules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>
              Your team members and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.length > 0 ? (
                teamMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-muted-foreground">{member.position?.title || "Not assigned"}</p>
                    </div>
                    <div className="text-sm text-green-600">Active</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No team members found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
            <CardDescription>Latest leave requests from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeaveRequests.length > 0 ? (
                recentLeaveRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{request.employee.firstName} {request.employee.lastName}</p>
                      <p className="text-xs text-muted-foreground">{request.startDate.toDateString()} - {request.endDate.toDateString()}</p>
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
            <CardDescription>Latest requisitions from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequisitions.length > 0 ? (
                recentRequisitions.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{req.employee.firstName} {req.employee.lastName}</p>
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
