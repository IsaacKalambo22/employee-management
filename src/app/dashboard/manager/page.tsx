import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getManagerDashboardAnalytics } from "@/lib/actions/analytics"
import { Users, Calendar, FileText, TrendingUp, Clock, CheckCircle } from "lucide-react"

export default async function ManagerDashboard() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return <div>Unauthorized</div>
  }

  const analytics = await getManagerDashboardAnalytics()

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
            <div className="text-2xl font-bold">{analytics.team.teamSize}</div>
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
            <div className="text-2xl font-bold">{analytics.team.pendingLeaveApprovals + analytics.team.pendingRequisitionApprovals}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.team.pendingLeaveApprovals} leave, {analytics.team.pendingRequisitionApprovals} requisitions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.team.presentToday}/{analytics.team.teamSize}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.team.onLeaveToday} on leave today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.leave.approved}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.leave.pending} pending this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>
              Your team members and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.team.teamMembers.length > 0 ? (
                analytics.team.teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.department}</p>
                    </div>
                    <div className={`text-sm ${member.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}>
                      {member.status}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No team members found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Quick actions for team management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Leave Approvals ({analytics.team.pendingLeaveApprovals} pending)</p>
                <p className="text-xs text-muted-foreground">Review and approve leave requests</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Requisition Reviews ({analytics.team.pendingRequisitionApprovals} pending)</p>
                <p className="text-xs text-muted-foreground">Process team requisitions</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Team Attendance</p>
                <p className="text-xs text-muted-foreground">View attendance records</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="text-sm font-medium">Team Performance</p>
                <p className="text-xs text-muted-foreground">View team metrics and KPIs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leave Analytics</CardTitle>
            <CardDescription>Leave request statistics for your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analytics.leave.approved}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{analytics.leave.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{analytics.leave.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{analytics.leave.cancelled}</div>
                <div className="text-sm text-gray-600">Cancelled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requisition Analytics</CardTitle>
            <CardDescription>Requisition statistics for your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analytics.requisition.approved}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{analytics.requisition.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{analytics.requisition.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{isNaN(analytics.requisition.totalAmount) ? 0 : (analytics.requisition.totalAmount?.toLocaleString() || 0)}</div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
