"use client"

import { useState, useTransition } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clockOut } from "@/lib/actions/attendance"
import { toast } from "sonner"

export function ClockOutForm() {
  const [isPending, startTransition] = useTransition()

  const handleClockOut = () => {
    startTransition(async () => {
      const result = await clockOut()
      if (result.success) {
        toast.success(result.message || "Clocked out successfully")
      } else {
        toast.error(result.message || "Failed to clock out")
      }
    })
  }

  return (
    <Button className="flex-1" variant="outline" onClick={handleClockOut} disabled={isPending}>
      <LogOut className="mr-2 h-4 w-4" />
      Clock Out
    </Button>
  )
}
