import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getPayslipDetail } from "@/lib/actions/payroll"
import { formatMWK, formatPeriod } from "@/lib/payroll/calculations"
import { StatusBadge } from "@/components/finance/status-badge"

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payslip = await getPayslipDetail(id)
  if (!payslip) notFound()

  const earnings = payslip.items.filter((i) => i.type === "EARNING")
  const deductions = payslip.items.filter((i) => i.type === "DEDUCTION")
  const taxes = deductions.filter((i) => i.code === "PAYE")
  const otherDeductions = deductions.filter((i) => i.code !== "PAYE")
  const totalDeductions = Number(payslip.tax) + Number(payslip.otherDeductions)

  // Payslips generated before itemisation only have totals
  const legacy = payslip.items.length === 0

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/dashboard/payroll" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center w-fit")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Payroll
        </Link>
        <a href={`/api/payslips/${payslip.id}/pdf`} className={cn(buttonVariants({ size: "sm" }), "inline-flex items-center w-fit")}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </a>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Payslip — {formatPeriod(payslip.payroll.period)}</CardTitle>
              <CardDescription className="mt-1">
                {payslip.employee.firstName} {payslip.employee.lastName}
                {payslip.employee.position && ` · ${payslip.employee.position.title}`}
                {payslip.employee.department && ` · ${payslip.employee.department.name}`}
              </CardDescription>
            </div>
            <StatusBadge status={payslip.payroll.status} />
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Grade</dt>
              <dd className="font-medium">{payslip.employee.grade ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pay Period</dt>
              <dd className="font-medium">
                {new Date(payslip.payroll.startDate).toLocaleDateString("en-GB")} – {new Date(payslip.payroll.endDate).toLocaleDateString("en-GB")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Payment Date</dt>
              <dd className="font-medium">{payslip.payDate ? new Date(payslip.payDate).toLocaleDateString("en-GB") : "Pending"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reference</dt>
              <dd className="font-medium font-mono">{payslip.id.slice(0, 8).toUpperCase()}</dd>
            </div>
          </dl>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid gap-8 md:grid-cols-2">
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Earnings</h3>
              <div className="space-y-2 text-sm">
                {legacy ? (
                  <>
                    <Line label="Basic Salary" amount={payslip.baseSalary} />
                    {Number(payslip.allowance) > 0 && <Line label="Allowances" amount={payslip.allowance} />}
                    {Number(payslip.bonus) > 0 && <Line label="Bonus" amount={payslip.bonus} />}
                  </>
                ) : (
                  earnings.map((item) => <Line key={item.id} label={item.label} amount={item.amount} />)
                )}
                <Line label="Gross Pay" amount={payslip.grossPay} total />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Taxes</h3>
              <div className="space-y-2 text-sm mb-6">
                {legacy || taxes.length === 0 ? (
                  <Line label="PAYE Tax" amount={payslip.tax} />
                ) : (
                  taxes.map((item) => <Line key={item.id} label={item.label} amount={item.amount} />)
                )}
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mb-3">Deductions</h3>
              <div className="space-y-2 text-sm">
                {legacy ? (
                  <Line label="Other Deductions" amount={payslip.otherDeductions} />
                ) : otherDeductions.length === 0 ? (
                  <p className="text-muted-foreground">No other deductions</p>
                ) : (
                  otherDeductions.map((item) => <Line key={item.id} label={item.label} amount={item.amount} />)
                )}
                <Line label="Total Deductions" amount={totalDeductions} total />
              </div>
            </section>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-4">
            <span className="font-semibold text-gray-900">Net Pay</span>
            <span className="text-2xl font-bold text-green-700">{formatMWK(payslip.netPay)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Line({ label, amount, total }: { label: string; amount: unknown; total?: boolean }) {
  return (
    <div className={cn("flex justify-between", total && "border-t pt-2 font-semibold")}>
      <span className={total ? "text-gray-900" : "text-gray-600"}>{label}</span>
      <span>{formatMWK(amount as number)}</span>
    </div>
  )
}
