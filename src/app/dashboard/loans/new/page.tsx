import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getMyLoanEligibility } from "@/lib/actions/loans"
import { LoanForm } from "@/components/loans/loan-form"

export default async function NewLoanPage() {
  const eligibility = await getMyLoanEligibility()

  const blocker = !eligibility
    ? "No employee record is linked to your account."
    : !eligibility.hasSalary
      ? "Your salary has not been set up in payroll yet. HR must add it (Payroll → Employee Salaries) before you can apply."
      : eligibility.hasOpenLoan
        ? "You already have a loan pending review or being repaid."
        : null

  return (
    <div className="space-y-6">
      <Link href="/dashboard/loans" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Loans
      </Link>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Apply for a Staff Loan</h1>
        <p className="text-gray-600 text-sm mt-1">Applications are reviewed by Finance</p>
      </div>
      {blocker ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">{blocker}</div>
      ) : (
        <LoanForm monthlyGross={eligibility!.monthlyGross} />
      )}
    </div>
  )
}
