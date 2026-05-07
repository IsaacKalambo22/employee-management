import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, CheckCircle, Clock, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLeaveBalances, getLeaveRequests } from "@/lib/actions/leaves"

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  MANAGER_APPROVED: { label: "Manager Approved", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  HR_APPROVED: { label: "HR Approved", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: XCircle },
}

export default async function LeavePage() {
  const session = await getServerSession(authOptions)
  const employeeId = session?.user?.employeeId

  const [balances, requests] = await Promise.all([
    employeeId ? getLeaveBalances(employeeId) : [],
    getLeaveRequests(employeeId),
  ])

  const totalAvailable = balances.reduce((sum: number, b: any) => sum + (b.allocated - b.used - b.pending), 0)
  const totalUsed = balances.reduce((sum: number, b: any) => sum + b.used, 0)
  const pendingCount = requests.filter((r: any) => r.status === "PENDING").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage leave requests and approvals</p>
        </div>
        {employeeId && (
          <Link href="/dashboard/leave/new" className={cn(buttonVariants({ size: "sm" }), "inline-flex items-center")}>
            <Plus className="mr-2 h-4 w-4" />
            Apply for Leave
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Available</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totalAvailable} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Used This Year</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{totalUsed} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Pending Requests</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Policies</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">{balances.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
          <CardDescription>Your leave balance by policy</CardDescription>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave balances found</p>
          ) : (
            <div className="space-y-2">
              {balances.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{b.policy.name}</p>
                    <p className="text-xs text-muted-foreground">{b.allocated} allocated / {b.used} used / {b.pending} pending</p>
                  </div>
                  <Badge variant={b.allocated - b.used - b.pending > 0 ? "default" : "secondary"}>
                    {b.allocated - b.used - b.pending} days left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>{requests.length} request{requests.length !== 1 ? "s" : ""} total</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No leave requests yet</p>
              <p className="text-xs mt-1">Submit a leave request to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r: any) => {
                const config = statusConfig[r.status] || statusConfig.PENDING
                const Icon = config.icon
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("p-2 rounded-full", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.employee.firstName} {r.employee.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.policy.name} • {r.days} day{r.days !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
