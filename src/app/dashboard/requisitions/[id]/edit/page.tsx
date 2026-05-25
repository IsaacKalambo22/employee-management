import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRequisition, updateRequisition } from "@/lib/actions/requisitions"
import { RequisitionForm } from "@/components/requisitions/requisition-form"
import { notFound } from "next/navigation"

export default async function EditRequisitionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.employeeId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No employee linked to your account</p>
      </div>
    )
  }

  const { id } = await params
  const requisition = await getRequisition(id)

  if (!requisition) {
    notFound()
  }

  if (requisition.status !== "PENDING") {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Can only edit pending requisitions</p>
        <Link href="/dashboard/requisitions" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex items-center")}>
          Back to Requisitions
        </Link>
      </div>
    )
  }

  const defaultValues = {
    title: requisition.title,
    description: requisition.description,
    amount: requisition.amount?.toString() || "",
    category: requisition.category,
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
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit Requisition</h1>
        <p className="text-gray-600 text-sm mt-1">Update your requisition details</p>
      </div>
      <RequisitionForm 
        action={(prevState, formData) => updateRequisition(id, prevState, formData)} 
        defaultValues={defaultValues}
      />
    </div>
  )
}
