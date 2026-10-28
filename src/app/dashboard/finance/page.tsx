import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getPayrollAnalytics } from "@/lib/actions/analytics"
import { getDepartmentBudgets, getPendingFinanceApprovalCount } from "@/lib/actions/finance"
import { formatMWK } from "@/lib/payroll/calculations"
import { UtilizationBar, utilizationColor } from "@/components/finance/status-badge"
import { DollarSign, TrendingUp, AlertTriangle, Wallet } from "lucide-react"

export default async function FinanceDashboard({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const fiscalYear = Number(params.year) || currentYear

  const [budgets, pendingCount, payroll] = await Promise.all([
    getDepartmentBudgets(fiscalYear),
    getPendingFinanceApprovalCount(),
    getPayrollAnalytics(),
  ])
  const { totals } = budgets

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
          <Link
            key={y}
            href={`/dashboard/finance?year=${y}`}
            className={cn(buttonVariants({ variant: y === fiscalYear ? "secondary" : "ghost", size: "sm" }))}
          >
            FY {y}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMWK(totals.approved)}</div>
            <p className="text-xs text-muted-foreground">Approved project budgets, FY {fiscalYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMWK(totals.spent)}</div>
            <p className="text-xs text-muted-foreground">{formatMWK(totals.remaining)} remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", utilizationColor(totals.utilizationRate).text)}>
              {totals.utilizationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Across all departments</p>
          </CardContent>
        </Card>
        <Link href="/dashboard/finance/approvals">
          <Card className="h-full hover:border-blue-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting finance review</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Budgets</CardTitle>
          <CardDescription>
            Each department&apos;s budget is the total of its approved projects for FY {fiscalYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Projects</TableHead>
                <TableHead className="text-right hidden md:table-cell">Proposed</TableHead>
                <TableHead className="text-right">Total Budget</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Spent</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Remaining</TableHead>
                <TableHead className="w-36">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.departments.map((dept) => (
                <TableRow key={dept.departmentId}>
                  <TableCell>
                    <p className="font-medium">{dept.department}</p>
                    {dept.pendingCount > 0 && (
                      <p className="text-xs text-yellow-700">{dept.pendingCount} awaiting review</p>
                    )}
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">{dept.projectCount}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{formatMWK(dept.proposed)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMWK(dept.approved)}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{formatMWK(dept.spent)}</TableCell>
                  <TableCell className="text-right hidden lg:table-cell">{formatMWK(dept.remaining)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <UtilizationBar rate={dept.utilizationRate} />
                      <p className={cn("text-xs font-medium", utilizationColor(dept.utilizationRate).text)}>
                        {dept.utilizationRate.toFixed(1)}%
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="hidden sm:table-cell" />
                <TableCell className="text-right hidden md:table-cell">{formatMWK(totals.proposed)}</TableCell>
                <TableCell className="text-right font-semibold">{formatMWK(totals.approved)}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">{formatMWK(totals.spent)}</TableCell>
                <TableCell className="text-right hidden lg:table-cell">{formatMWK(totals.remaining)}</TableCell>
                <TableCell className="font-semibold">{totals.utilizationRate.toFixed(1)}%</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>Payslips generated this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{payroll.totalEmployees}</div>
              <div className="text-sm text-gray-600">Employees Paid</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{formatMWK(payroll.totalGrossPay)}</div>
              <div className="text-sm text-gray-600">Total Gross Pay</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{formatMWK(payroll.totalTax)}</div>
              <div className="text-sm text-gray-600">PAYE Payable</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{formatMWK(payroll.totalNetPay)}</div>
              <div className="text-sm text-gray-600">Total Net Pay</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
