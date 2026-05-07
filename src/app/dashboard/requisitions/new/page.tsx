import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createRequisition } from "@/lib/actions/requisitions"
import { RequisitionForm } from "@/components/requisitions/requisition-form"


export default async function NewRequisitionPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user.employeeId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No employee linked to your account</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/requisitions" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Requisitions
        </Link>
      </div>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">New Requisition</h1>
        <p className="text-gray-600 text-sm mt-1">Submit a new requisition request</p>
      </div>
      <RequisitionForm action={createRequisition} />
    </div>
  )
}
