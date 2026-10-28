import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLeaveBalances, getPolicies, getLeaveRequest, updateLeave } from "@/lib/actions/leaves"
import { LeaveForm } from "@/components/leaves/leave-form"
import { notFound } from "next/navigation"

export default async function EditLeavePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.employeeId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No employee linked to your account</p>
      </div>
    )
  }

  const { id } = await params
  const [balances, policies, leaveRequest] = await Promise.all([
    getLeaveBalances(session.user.employeeId),
    getPolicies(),
    getLeaveRequest(id),
  ])

  if (!leaveRequest) {
    notFound()
  }

  if (leaveRequest.status !== "PENDING") {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Can only edit pending leave requests</p>
        <Link href="/dashboard/leave" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex items-center")}>
          Back to Leave
        </Link>
      </div>
    )
  }

  const defaultValues = {
    policyId: leaveRequest.policyId,
    startDate: leaveRequest.startDate.toISOString().split('T')[0],
    endDate: leaveRequest.endDate.toISOString().split('T')[0],
    reason: leaveRequest.reason || "",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leave" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Leave
        </Link>
      </div>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit Leave Request</h1>
        <p className="text-gray-600 text-sm mt-1">Update your leave request details</p>
      </div>
      <LeaveForm 
        action={updateLeave.bind(null, id)} 
        policies={policies} 
        balances={balances}
        defaultValues={defaultValues}
      />
    </div>
  )
}
