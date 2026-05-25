import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getFinanceDashboardAnalytics } from "@/lib/actions/analytics"
import { DollarSign, FileText, TrendingUp, AlertTriangle } from "lucide-react"

export default async function FinanceDashboard() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return <div>Unauthorized</div>
  }

  const analytics = await getFinanceDashboardAnalytics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="text-gray-600">Budget management and requisition oversight</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.budget.totalAllocated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Allocated this fiscal year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.budget.utilizationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.budget.totalSpent.toLocaleString()} spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingFinanceApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting finance review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisitions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.requisition.approved}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.requisition.pending} pending
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
                    <span className={`font-medium ${budget.utilizationRate > 90 ? 'text-red-600' : budget.utilizationRate > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {budget.utilizationRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${budget.utilizationRate > 90 ? 'bg-red-600' : budget.utilizationRate > 75 ? 'bg-yellow-600' : 'bg-green-600'}`}
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

        <Card>
          <CardHeader>
            <CardTitle>Requisition Analytics</CardTitle>
            <CardDescription>Requisition statistics this month</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>Current payroll period overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.payroll.totalEmployees}</div>
              <div className="text-sm text-gray-600">Employees</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.payroll.totalGrossPay.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Gross Pay</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analytics.payroll.totalNetPay.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Net Pay</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analytics.payroll.totalTax.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Tax</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts</CardTitle>
          <CardDescription>Budgets requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.budget.budgets
              .filter((budget) => budget.utilizationRate > 75)
              .map((budget) => (
                <div key={budget.id} className={`p-4 rounded-lg border ${budget.utilizationRate > 90 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{budget.department} - {budget.category}</p>
                      <p className="text-sm text-gray-600">
                        {budget.utilizationRate.toFixed(1)}% utilized ({budget.spent.toLocaleString()} / {budget.allocated.toLocaleString()})
                      </p>
                    </div>
                    <AlertTriangle className={`h-5 w-5 ${budget.utilizationRate > 90 ? 'text-red-600' : 'text-yellow-600'}`} />
                  </div>
                </div>
              ))}
            {analytics.budget.budgets.filter((budget) => budget.utilizationRate > 75).length === 0 && (
              <p className="text-sm text-muted-foreground">No budget alerts at this time</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
