import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  // Loans
  PENDING: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-700" },
  // Projects
  PENDING_REVIEW: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Completed", color: "bg-slate-100 text-slate-700" },
  // Payroll
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-700" },
  PROCESSED: { label: "Awaiting Payment", color: "bg-amber-100 text-amber-700" },
  PAID: { label: "Paid", color: "bg-emerald-100 text-emerald-700" },
  // Requisitions
  MANAGER_APPROVED: { label: "Awaiting Finance", color: "bg-blue-100 text-blue-700" },
  PENDING_FINANCE_APPROVAL: { label: "Awaiting Finance", color: "bg-blue-100 text-blue-700" },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: "bg-gray-100 text-gray-700" }
  return <Badge className={config.color}>{config.label}</Badge>
}

// Colour thresholds used across budget utilisation views
export function utilizationColor(rate: number) {
  if (rate > 90) return { text: "text-red-600", bar: "bg-red-600" }
  if (rate > 75) return { text: "text-yellow-600", bar: "bg-yellow-500" }
  return { text: "text-green-600", bar: "bg-green-600" }
}

export function UtilizationBar({ rate }: { rate: number }) {
  const color = utilizationColor(rate)
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`h-2 rounded-full ${color.bar}`} style={{ width: `${Math.min(rate, 100)}%` }} />
    </div>
  )
}
