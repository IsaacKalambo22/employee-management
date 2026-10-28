import Link from "next/link"
import { Plus, Wallet, ArrowRight } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { checkPermission } from "@/lib/permissions"
import { getMyLoanEligibility, getMyLoans } from "@/lib/actions/loans"
import { formatMWK } from "@/lib/payroll/calculations"
import { StatusBadge } from "@/components/finance/status-badge"
import { CancelLoanButton } from "@/components/loans/cancel-loan-button"

const monthYear = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"

export default async function LoansPage() {
  const session = await getServerSession(authOptions)
  const canReview = checkPermission(session?.user?.role, "REVIEW_LOAN")
  const [loans, eligibility] = await Promise.all([getMyLoans(), getMyLoanEligibility()])

  const now = new Date()
  const active = loans.filter((l) => l.status === "APPROVED" && l.repaymentEnd && l.repaymentEnd >= now)
  const outstanding = active.reduce((sum, loan) => sum + Math.max(0, Number(loan.amount) - loan.repaid), 0)
  const monthlyRepayment = active.reduce((sum, l) => sum + Number(l.monthlyInstallment), 0)
  const canApply = !!eligibility?.hasSalary && !eligibility.hasOpenLoan

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Staff Loans</h1>
          <p className="text-gray-600 text-sm mt-1">Apply for an interest-free staff loan repaid through payroll</p>
        </div>
        <div className="flex items-center gap-2">
          {canReview && (
            <Link href="/dashboard/finance/approvals" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex items-center")}>
              Review Applications
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
          {canApply && (
            <Link href="/dashboard/loans/new" className={cn(buttonVariants({ size: "sm" }), "inline-flex items-center")}>
              <Plus className="mr-2 h-4 w-4" />
              Apply for Loan
            </Link>
          )}
        </div>
      </div>

      {eligibility && !eligibility.hasSalary && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Your salary record has not been set up yet. Contact HR before applying for a loan.
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
            <CardDescription className="text-xs">Applications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{loans.length}</p>
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
              <p className="text-xs mt-1">Your loan history will appear here</p>
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
                        <p className="text-xs text-gray-500 mt-1 italic">Finance: {loan.reviewComment}</p>
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
    </div>
  )
}
