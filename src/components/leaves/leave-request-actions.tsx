"use client"

import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import { deleteLeave } from "@/lib/actions/leaves"
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
import { toast } from "sonner"

interface LeaveRequestActionsProps {
  requestId: string
  status: string
  employeeId?: string
  currentUserId?: string
}

export function LeaveRequestActions({ requestId, status, employeeId, currentUserId }: LeaveRequestActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()

  const canEdit = status === "PENDING" && employeeId === currentUserId
  const canDelete = status === "PENDING" && employeeId === currentUserId

  const handleDelete = async () => {
    setIsProcessing(true)
    const result = await deleteLeave(requestId)
    setIsProcessing(false)
    setDeleteDialogOpen(false)
    
    if (result.success) {
      toast.success("Leave request deleted successfully")
      router.refresh()
    } else {
      toast.error(result.message || "Failed to delete leave request")
    }
  }

  if (!canEdit && !canDelete) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/dashboard/leave/${requestId}/edit`)}
            className="h-8"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {canDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isProcessing}
            className="h-8"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this leave request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isProcessing}
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
