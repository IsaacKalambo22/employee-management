"use client"

import { useState, useTransition } from "react"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clockIn } from "@/lib/actions/attendance"
import { toast } from "sonner"

export function ClockInForm() {
  const [isPending, startTransition] = useTransition()

  const handleClockIn = () => {
    startTransition(async () => {
      const result = await clockIn()
      if (result.success) {
        toast.success(result.message || "Clocked in successfully")
      } else {
        toast.error(result.message || "Failed to clock in")
      }
    })
  }

  return (
    <Button className="flex-1" variant="default" onClick={handleClockIn} disabled={isPending}>
      <LogIn className="mr-2 h-4 w-4" />
      Clock In
    </Button>
  )
}
