import Link from "next/link"
import { Plus, Wallet, CheckCircle2 } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { checkPermission } from "@/lib/permissions"
import { getLoanApplications, getMyLoanEligibility, getMyLoans } from "@/lib/actions/loans"
import { formatMWK } from "@/lib/payroll/calculations"
import { StatusBadge } from "@/components/finance/status-badge"
import { CancelLoanButton } from "@/components/loans/cancel-loan-button"
import { LoanReviewActions } from "@/components/finance/review-actions"

const monthYear = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const params = await searchParams
  const session = await getServerSession(authOptions)
  const canReview = checkPermission(session?.user?.role, "REVIEW_LOAN")
  const hasEmployee = !!session?.user?.employeeId
  // Reviewers without an employee record (e.g. system admin) only have the review view
  const view = canReview && (params.view === "review" || !hasEmployee) ? "review" : "mine"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Staff Loans</h1>
          <p className="text-gray-600 text-sm mt-1">
            {view === "review"
              ? "Review staff loan applications"
              : "Apply for an interest-free staff loan repaid through payroll"}
          </p>
        </div>
        {hasEmployee && (
          <Link href="/dashboard/loans/new" className={cn(buttonVariants({ size: "sm" }), "inline-flex items-center w-fit")}>
            <Plus className="mr-2 h-4 w-4" />
            Apply for Loan
          </Link>
        )}
      </div>

      {canReview && hasEmployee && <LoanTabs view={view} />}

      {!hasEmployee && !canReview && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Your account is not linked to an employee record, so you cannot apply for a loan. Contact HR.
        </div>
      )}

      {view === "review" ? <ReviewView currentEmployeeId={session?.user?.employeeId} /> : hasEmployee && <MyLoansView />}
    </div>
  )
}

function LoanTabs({ view }: { view: "mine" | "review" }) {
  const tabs = [
    { key: "mine", label: "My Loans", href: "/dashboard/loans" },
    { key: "review", label: "Review Applications", href: "/dashboard/loans?view=review" },
  ]
  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            view === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

async function MyLoansView() {
  const [loans, eligibility] = await Promise.all([getMyLoans(), getMyLoanEligibility()])

  const now = new Date()
  const active = loans.filter((l) => l.status === "APPROVED" && l.repaymentEnd && l.repaymentEnd >= now)
  const outstanding = active.reduce((sum, loan) => sum + Math.max(0, Number(loan.amount) - loan.repaid), 0)
  const monthlyRepayment = active.reduce((sum, l) => sum + Number(l.monthlyInstallment), 0)

  return (
    <>
      {eligibility && !eligibility.hasSalary && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Your salary has not been set up in payroll yet. HR must add it before a loan application can be submitted.
        </div>
      )}
      {eligibility?.hasOpenLoan && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          You have a loan that is pending review or still being repaid. New applications open once it is settled.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Outstanding Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{formatMWK(outstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Monthly Repayment</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatMWK(monthlyRepayment)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Maximum Loan</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatMWK((eligibility?.monthlyGross ?? 0) * 3)}</p>
            <p className="text-xs text-muted-foreground mt-1">3× monthly gross pay</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Loan Applications</CardTitle>
          <CardDescription>Approved loans are recovered automatically from your monthly payslip</CardDescription>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Wallet className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No loan applications</p>
              <p className="text-xs mt-1">Use &quot;Apply for Loan&quot; to submit your first application</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Term</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Installment</TableHead>
                  <TableHead className="hidden lg:table-cell">Repayment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <p className="font-medium">{new Date(loan.createdAt).toLocaleDateString("en-GB")}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[16rem]">{loan.purpose}</p>
                      {loan.reviewComment && (
                        <p className="text-xs text-gray-500 mt-1 italic">Reviewer: {loan.reviewComment}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatMWK(loan.amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{loan.termMonths} months</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{formatMWK(loan.monthlyInstallment)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {loan.repaymentStart ? `${monthYear(loan.repaymentStart)} – ${monthYear(loan.repaymentEnd)}` : "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={loan.status} /></TableCell>
                    <TableCell className="text-right">
                      {loan.status === "PENDING" && <CancelLoanButton loanId={loan.id} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

async function ReviewView({ currentEmployeeId }: { currentEmployeeId?: string }) {
  const applications = await getLoanApplications()
  const pending = applications.filter((l) => l.status === "PENDING")
  const decided = applications.filter((l) => l.status !== "PENDING")

  const grossOf = (loan: (typeof applications)[number]) => {
    const s = loan.employee.salary
    return s ? Number(s.baseSalary) + Number(s.allowance) + Number(s.bonus) : 0
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Awaiting Review ({pending.length})</CardTitle>
          <CardDescription>
            Approving a loan schedules equal monthly repayments through payroll from next month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mb-3 text-green-500" />
              <p className="text-sm font-medium text-gray-900">No applications awaiting review</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Term</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Installment</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">% of Gross</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((loan) => {
                  const gross = grossOf(loan)
                  return (
                    <TableRow key={loan.id}>
                      <TableCell className="max-w-xs">
                        <p className="font-medium">{loan.employee.firstName} {loan.employee.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {loan.employee.department?.name ?? "—"} · applied {new Date(loan.createdAt).toLocaleDateString("en-GB")}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{loan.purpose}</p>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatMWK(loan.amount)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{loan.termMonths} months</TableCell>
                      <TableCell className="text-right hidden md:table-cell">{formatMWK(loan.monthlyInstallment)}</TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
                        {gross > 0 ? `${((Number(loan.monthlyInstallment) / gross) * 100).toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {loan.employeeId === currentEmployeeId ? (
                          <span className="text-xs text-muted-foreground">Your application</span>
                        ) : (
                          <LoanReviewActions loanId={loan.id} />
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Decisions</CardTitle>
          <CardDescription>Approved, rejected and cancelled applications</CardDescription>
        </CardHeader>
        <CardContent>
          {decided.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No decisions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Repayment</TableHead>
                  <TableHead className="hidden sm:table-cell">Reviewed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decided.slice(0, 25).map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <p className="font-medium">{loan.employee.firstName} {loan.employee.lastName}</p>
                      {loan.reviewComment && <p className="text-xs text-gray-500 italic">{loan.reviewComment}</p>}
                    </TableCell>
                    <TableCell className="text-right">{formatMWK(loan.amount)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {loan.repaymentStart ? `${monthYear(loan.repaymentStart)} – ${monthYear(loan.repaymentEnd)}` : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {loan.reviewedAt ? new Date(loan.reviewedAt).toLocaleDateString("en-GB") : "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={loan.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
