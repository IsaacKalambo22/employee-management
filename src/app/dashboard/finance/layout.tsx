import { FinanceTabs } from "@/components/finance/finance-tabs"
import { getPendingFinanceApprovalCount } from "@/lib/actions/finance"

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pendingCount = await getPendingFinanceApprovalCount()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Finance</h1>
        <p className="text-gray-600 text-sm mt-1">Department budgets, budget utilisation and items awaiting Finance review</p>
      </div>
      <FinanceTabs pendingCount={pendingCount} />
      {children}
    </div>
  )
}
