import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLeaveBalances, getPolicies, createLeaveRequest } from "@/lib/actions/leaves"
import { LeaveForm } from "@/components/leaves/leave-form"

export default async function NewLeavePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user.employeeId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No employee linked to your account</p>
      </div>
    )
  }

  const [balances, policies] = await Promise.all([
    getLeaveBalances(session.user.employeeId),
    getPolicies(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leave" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Leave
        </Link>
      </div>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Apply for Leave</h1>
        <p className="text-gray-600 text-sm mt-1">Submit a new leave request</p>
      </div>
      <LeaveForm action={createLeaveRequest} policies={policies} balances={balances} />
    </div>
  )
}
