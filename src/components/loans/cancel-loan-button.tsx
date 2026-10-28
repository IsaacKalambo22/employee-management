"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cancelLoanApplication } from "@/lib/actions/loans"

export function CancelLoanButton({ loanId }: { loanId: string }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    if (!confirm("Cancel this loan application?")) return
    setIsProcessing(true)
    const result = await cancelLoanApplication(loanId)
    setIsProcessing(false)
    if (result.success) {
      toast.success("Loan application cancelled")
      router.refresh()
    } else {
      toast.error(result.message || "Failed to cancel application")
    }
  }

  return (
    <Button size="sm" variant="outline" className="h-8" onClick={handleCancel} disabled={isProcessing}>
      <X className="h-4 w-4 mr-1" />
      Cancel
    </Button>
  )
}
