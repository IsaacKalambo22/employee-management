"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Banknote } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { approveLoan, rejectLoan } from "@/lib/actions/loans"
import { approveProject, rejectProject } from "@/lib/actions/projects"
import { markPayrollPaid } from "@/lib/actions/payroll"

type ActionResult = { success?: boolean; message?: string }

function useReviewAction() {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const run = async (action: () => Promise<ActionResult>, successMessage: string) => {
    setIsProcessing(true)
    const result = await action()
    setIsProcessing(false)
    if (result.success) {
      toast.success(result.message ?? successMessage)
      router.refresh()
      return true
    }
    toast.error(result.message || "Action failed")
    return false
  }

  return { isProcessing, run }
}

function RejectDialog({
  open,
  onOpenChange,
  title,
  isProcessing,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  isProcessing: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setReason("") }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Provide a reason for this decision. It will be shared with the requester.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Enter reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="mt-4"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isProcessing}
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Please provide a reason")
                return
              }
              onConfirm(reason)
            }}
          >
            {isProcessing ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function LoanReviewActions({ loanId }: { loanId: string }) {
  const { isProcessing, run } = useReviewAction()
  const [rejectOpen, setRejectOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-8" disabled={isProcessing} onClick={() => run(() => approveLoan(loanId), "Loan approved")}>
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <Button size="sm" variant="destructive" className="h-8" disabled={isProcessing} onClick={() => setRejectOpen(true)}>
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </div>
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Loan Application"
        isProcessing={isProcessing}
        onConfirm={async (reason) => {
          if (await run(() => rejectLoan(loanId, reason), "Loan rejected")) setRejectOpen(false)
        }}
      />
    </>
  )
}

export function ProjectReviewActions({ projectId, proposedBudget }: { projectId: string; proposedBudget: number }) {
  const { isProcessing, run } = useReviewAction()
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [budget, setBudget] = useState(String(proposedBudget))
  const [comment, setComment] = useState("")

  const handleApprove = async () => {
    const amount = Number(budget)
    if (!amount || amount <= 0) {
      toast.error("Enter a valid approved budget")
      return
    }
    if (await run(() => approveProject(projectId, amount, comment), "Project approved")) {
      setApproveOpen(false)
      setComment("")
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-8" disabled={isProcessing} onClick={() => setApproveOpen(true)}>
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <Button size="sm" variant="destructive" className="h-8" disabled={isProcessing} onClick={() => setRejectOpen(true)}>
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Project Budget</DialogTitle>
            <DialogDescription>
              Confirm the budget to allocate. You may approve less than the proposed amount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="approvedBudget">Approved Budget (MWK)</Label>
              <Input
                id="approvedBudget"
                type="number"
                min="0"
                max={proposedBudget}
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Proposed: MWK {proposedBudget.toLocaleString()}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approvalComment">Comment (optional)</Label>
              <Textarea id="approvalComment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Approving..." : "Approve Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Project Proposal"
        isProcessing={isProcessing}
        onConfirm={async (reason) => {
          if (await run(() => rejectProject(projectId, reason), "Project rejected")) setRejectOpen(false)
        }}
      />
    </>
  )
}

export function PayrollReleaseButton({ payrollId, period }: { payrollId: string; period: string }) {
  const { isProcessing, run } = useReviewAction()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <Button size="sm" className="h-8" disabled={isProcessing} onClick={() => setConfirmOpen(true)}>
        <Banknote className="h-4 w-4 mr-1" />
        Mark as Paid
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Payroll</DialogTitle>
            <DialogDescription>
              Confirm that salaries for {period} have been paid. Employees will be notified and the payroll will be locked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              disabled={isProcessing}
              onClick={async () => {
                if (await run(() => markPayrollPaid(payrollId), "Payroll marked as paid")) setConfirmOpen(false)
              }}
            >
              {isProcessing ? "Releasing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
