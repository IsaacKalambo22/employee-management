"use client"

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { approveLeave, rejectLeave } from "@/lib/actions/leaves"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface LeaveApprovalActionsProps {
  requestId: string
  status: string
  currentLevel?: number
}

export function LeaveApprovalActions({ requestId, status, currentLevel = 1 }: LeaveApprovalActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState("")
  const router = useRouter()

  const canApprove = status === "PENDING" || status === "MANAGER_APPROVED"
  const canReject = status === "PENDING" || status === "MANAGER_APPROVED" || status === "HR_APPROVED"
  
  // Don't show any buttons if already fully approved or rejected
  if (status === "APPROVED" || status === "REJECTED" || status === "CANCELLED") {
    return null
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    const result = await approveLeave(requestId, currentLevel)
    setIsProcessing(false)
    if (result.success) {
      toast.success("Leave request approved successfully")
      router.refresh()
    } else {
      toast.error(result.message || "Failed to approve leave request")
    }
  }

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }
    
    setIsProcessing(true)
    const result = await rejectLeave(requestId, rejectComment)
    setIsProcessing(false)
    setRejectDialogOpen(false)
    setRejectComment("")
    
    if (result.success) {
      toast.success("Leave request rejected successfully")
      router.refresh()
    } else {
      toast.error(result.message || "Failed to reject leave request")
    }
  }

  if (!canApprove && !canReject) {
    return null
  }

  return (
    <>
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
            onClick={() => setRejectDialogOpen(true)}
            disabled={isProcessing}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        )}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request. This will be communicated to the employee.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={4}
            className="mt-4"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectComment("")
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
