"use client"

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { approveLeave, rejectLeave } from "@/lib/actions/leaves"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface LeaveApprovalActionsProps {
  requestId: string
  status: string
  currentLevel?: number
}

export function LeaveApprovalActions({ requestId, status, currentLevel = 1 }: LeaveApprovalActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const canApprove = status === "PENDING" || status === "MANAGER_APPROVED"
  const canReject = status === "PENDING" || status === "MANAGER_APPROVED" || status === "HR_APPROVED"

  const handleApprove = async () => {
    setIsProcessing(true)
    const result = await approveLeave(requestId, currentLevel)
    setIsProcessing(false)
    if (result.success) {
      router.refresh()
    }
  }

  const handleReject = async () => {
    const comment = prompt("Please provide a reason for rejection:")
    if (!comment) return
    
    setIsProcessing(true)
    const result = await rejectLeave(requestId, comment)
    setIsProcessing(false)
    if (result.success) {
      router.refresh()
    }
  }

  if (!canApprove && !canReject) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {canApprove && (
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={isProcessing}
          className="h-8"
        >
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
      )}
      {canReject && (
        <Button
          size="sm"
          variant="destructive"
          onClick={handleReject}
          disabled={isProcessing}
          className="h-8"
        >
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
      )}
    </div>
  )
}
