import Link from "next/link"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { ArrowLeft } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { checkPermission } from "@/lib/permissions"
import { getPayroll } from "@/lib/actions/payroll"
import { formatMWK, formatPeriod } from "@/lib/payroll/calculations"
import { StatusBadge } from "@/components/finance/status-badge"
import { PayrollReleaseButton } from "@/components/finance/review-actions"
import { RecalculatePayrollButton } from "@/components/payroll/payroll-admin-actions"

export default async function PayrollRunPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!checkPermission(role, "READ_PAYROLL")) notFound()

  const { id } = await params
  const payroll = await getPayroll(id)
  if (!payroll) notFound()

  // Pull PAYE / pension / loan out of the itemised lines so each column reconciles
  const rows = payroll.payslips.map((p) => {
    const item = (code: string) =>
      p.items.filter((i) => i.code === code).reduce((sum, i) => sum + Number(i.amount), 0)
    const pension = item("PENSION")
    const loan = item("LOAN")
    return {
      payslip: p,
      pension,
      loan,
      other: Number(p.otherDeductions) - pension - loan,
    }
  })
  const sum = (fn: (r: (typeof rows)[number]) => number) => rows.reduce((total, r) => total + fn(r), 0)
  const period = formatPeriod(payroll.period)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/dashboard/payroll" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center w-fit")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Payroll
        </Link>
        <div className="flex items-center gap-2">
          {payroll.status === "PROCESSED" && checkPermission(role, "CREATE_PAYROLL") && (
            <RecalculatePayrollButton payrollId={payroll.id} period={period} />
          )}
          {payroll.status === "PROCESSED" && checkPermission(role, "APPROVE_PAYROLL") && payroll.processedBy !== session?.user?.id && (
            <PayrollReleaseButton payrollId={payroll.id} period={period} />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Payroll — {period}</CardTitle>
              <CardDescription>
                {payroll.payslips.length} employee(s)
                {payroll.processedAt && ` · processed ${new Date(payroll.processedAt).toLocaleString("en-GB")}`}
              </CardDescription>
            </div>
            <StatusBadge status={payroll.status} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">PAYE</TableHead>
                <TableHead className="text-right">Pension</TableHead>
                <TableHead className="text-right">Loan</TableHead>
                <TableHead className="text-right">Other</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ payslip, pension, loan, other }) => (
                <TableRow key={payslip.id}>
                  <TableCell>
                    <p className="font-medium">{payslip.employee.firstName} {payslip.employee.lastName}</p>
                    <p className="text-xs text-muted-foreground">{payslip.employee.department?.name ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-right">{formatMWK(payslip.baseSalary)}</TableCell>
                  <TableCell className="text-right">{formatMWK(payslip.allowance)}</TableCell>
                  <TableCell className="text-right">{formatMWK(payslip.bonus)}</TableCell>
                  <TableCell className="text-right font-medium">{formatMWK(payslip.grossPay)}</TableCell>
                  <TableCell className="text-right">{formatMWK(payslip.tax)}</TableCell>
                  <TableCell className="text-right">{formatMWK(pension)}</TableCell>
                  <TableCell className="text-right">{formatMWK(loan)}</TableCell>
                  <TableCell className="text-right">{formatMWK(other)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMWK(payslip.netPay)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/payroll/payslips/${payslip.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                      Payslip
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right">{formatMWK(sum((r) => Number(r.payslip.baseSalary)))}</TableCell>
                <TableCell className="text-right">{formatMWK(sum((r) => Number(r.payslip.allowance)))}</TableCell>
                <TableCell className="text-right">{formatMWK(sum((r) => Number(r.payslip.bonus)))}</TableCell>
                <TableCell className="text-right font-semibold">{formatMWK(sum((r) => Number(r.payslip.grossPay)))}</TableCell>
                <TableCell className="text-right">{formatMWK(sum((r) => Number(r.payslip.tax)))}</TableCell>
                <TableCell className="text-right">{formatMWK(sum((r) => r.pension))}</TableCell>
                <TableCell className="text-right">{formatMWK(sum((r) => r.loan))}</TableCell>
                <TableCell className="text-right">{formatMWK(sum((r) => r.other))}</TableCell>
                <TableCell className="text-right font-semibold">{formatMWK(sum((r) => Number(r.payslip.netPay)))}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
