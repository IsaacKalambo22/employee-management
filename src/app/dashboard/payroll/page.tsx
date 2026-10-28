import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Calendar, Download, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions"
import { getMyPayslips, getPayrollEmployees, getPayrolls } from "@/lib/actions/payroll"
import { formatMWK, formatPeriod } from "@/lib/payroll/calculations"
import { StatusBadge } from "@/components/finance/status-badge"
import { PayrollReleaseButton } from "@/components/finance/review-actions"
import { RunPayrollDialog, SalaryDialog } from "@/components/payroll/payroll-admin-actions"

export default async function PayrollPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const canReadPayroll = checkPermission(role, "READ_PAYROLL")
  const canProcess = checkPermission(role, "CREATE_PAYROLL")
  const canManageSalaries = checkPermission(role, "UPDATE_PAYROLL")
  const canRelease = checkPermission(role, "APPROVE_PAYROLL")

  const [payslips, payrolls, employees] = await Promise.all([
    session?.user?.employeeId ? getMyPayslips() : [],
    canReadPayroll ? getPayrolls() : [],
    canManageSalaries ? getPayrollEmployees() : [],
  ])

  const currentYear = String(new Date().getFullYear())
  const ytd = payslips.filter((p) => p.payroll.period.startsWith(currentYear))
  const latest = payslips[0]
  const ytdGross = ytd.reduce((sum, p) => sum + Number(p.grossPay), 0)
  const ytdTax = ytd.reduce((sum, p) => sum + Number(p.tax), 0)
  const ytdNet = ytd.reduce((sum, p) => sum + Number(p.netPay), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600 text-sm mt-1">
            {canReadPayroll ? "Monthly payslips, payroll processing and salaries" : "Your monthly payslips, earnings and deductions"}
          </p>
        </div>
        {canReadPayroll && (
          <div className="flex items-center gap-2">
            <Link href="/api/export/payroll/pdf" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex items-center")}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Link>
            <Link href="/api/export/payroll/excel" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex items-center")}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Link>
            {canProcess && <RunPayrollDialog />}
          </div>
        )}
      </div>

      {session?.user?.employeeId && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Latest Net Pay</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{latest ? formatMWK(latest.netPay) : "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">{latest ? formatPeriod(latest.payroll.period) : "No payslip yet"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Gross Earnings ({currentYear})</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatMWK(ytdGross)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">PAYE Paid ({currentYear})</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{formatMWK(ytdTax)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Net Pay ({currentYear})</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{formatMWK(ytdNet)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My Payslips</CardTitle>
              <CardDescription>Select a month to view the full breakdown or download the PDF</CardDescription>
            </CardHeader>
            <CardContent>
              {payslips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <DollarSign className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No payslips available yet</p>
                  <p className="text-xs mt-1">Payslips appear here once monthly payroll has been processed</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Gross Pay</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">PAYE</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Other Deductions</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell className="font-medium">{formatPeriod(payslip.payroll.period)}</TableCell>
                        <TableCell className="text-right">{formatMWK(payslip.grossPay)}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{formatMWK(payslip.tax)}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{formatMWK(payslip.otherDeductions)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatMWK(payslip.netPay)}</TableCell>
                        <TableCell className="hidden md:table-cell"><StatusBadge status={payslip.payroll.status} /></TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/dashboard/payroll/payslips/${payslip.id}`}
                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}
                          >
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {canReadPayroll && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Runs</CardTitle>
            <CardDescription>Processed payrolls are released for payment by Finance</CardDescription>
          </CardHeader>
          <CardContent>
            {payrolls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No payroll periods yet</p>
                <p className="text-xs mt-1">Set up salaries, then run your first monthly payroll</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="hidden sm:table-cell">Employees</TableHead>
                    <TableHead className="text-right">Total Gross</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Total PAYE</TableHead>
                    <TableHead className="text-right">Total Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map((payroll) => {
                    const gross = payroll.payslips.reduce((sum, p) => sum + Number(p.grossPay), 0)
                    const tax = payroll.payslips.reduce((sum, p) => sum + Number(p.tax), 0)
                    const net = payroll.payslips.reduce((sum, p) => sum + Number(p.netPay), 0)
                    return (
                      <TableRow key={payroll.id}>
                        <TableCell className="font-medium">{formatPeriod(payroll.period)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{payroll.payslips.length}</TableCell>
                        <TableCell className="text-right">{formatMWK(gross)}</TableCell>
                        <TableCell className="text-right hidden md:table-cell">{formatMWK(tax)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatMWK(net)}</TableCell>
                        <TableCell><StatusBadge status={payroll.status} /></TableCell>
                        <TableCell className="text-right">
                          {canRelease && payroll.status === "PROCESSED" && payroll.processedBy !== session?.user?.id && (
                            <PayrollReleaseButton payrollId={payroll.id} period={formatPeriod(payroll.period)} />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {canManageSalaries && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Salaries</CardTitle>
            <CardDescription>Monthly salary structure used when payroll is processed</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Allowances</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Bonus</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-muted-foreground">{emp.position?.title ?? "—"}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{emp.department?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">{emp.salary ? formatMWK(emp.salary.baseSalary) : <span className="text-muted-foreground">Not set</span>}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{emp.salary ? formatMWK(emp.salary.allowance) : "—"}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">{emp.salary ? formatMWK(emp.salary.bonus) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <SalaryDialog
                        employeeId={emp.id}
                        employeeName={`${emp.firstName} ${emp.lastName}`}
                        salary={emp.salary ? {
                          baseSalary: Number(emp.salary.baseSalary),
                          allowance: Number(emp.salary.allowance),
                          bonus: Number(emp.salary.bonus),
                          deductions: Number(emp.salary.deductions),
                        } : null}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
