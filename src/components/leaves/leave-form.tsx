"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { LeaveFormState } from "@/lib/actions/leaves"

interface Policy { id: string; name: string; daysPerYear: number }
interface Balance { id: string; policyId: string; allocated: number; used: number; pending: number }

interface LeaveFormProps {
  action: (prevState: LeaveFormState, formData: FormData) => Promise<LeaveFormState>
  policies: Policy[]
  balances: Balance[]
  defaultValues?: {
    policyId: string
    startDate: string
    endDate: string
    reason: string
  }
}

const initialState: LeaveFormState = {}

export function LeaveForm({ action, policies, balances, defaultValues }: LeaveFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Leave request submitted")
      router.push("/dashboard/leave")
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, router])

  const getBalanceInfo = (policyId: string) => {
    const balance = balances.find((b) => b.policyId === policyId)
    if (!balance) {
      // No balance record yet - employee is newly created or balances not yet seeded.
      // Show the policy's full days and allow selection.
      const policy = policies.find((p) => p.id === policyId)
      return { available: policy?.daysPerYear ?? null, hasRecord: false }
    }
    const available = balance.allocated - balance.used - balance.pending
    return { available, hasRecord: true }
  }

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="policyId">Leave Type *</Label>
            <select
              id="policyId"
              name="policyId"
              required
              defaultValue={defaultValues?.policyId}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select leave type...</option>
              {policies.map((p) => {
                const { available, hasRecord } = getBalanceInfo(p.id)
                // Only disable if balance record exists AND is fully exhausted
                const isDisabled = hasRecord && available !== null && available <= 0
                const label = available === null
                  ? p.name
                  : `${p.name} (${available} day${available !== 1 ? "s" : ""} available)`
                return (
                  <option key={p.id} value={p.id} disabled={isDisabled}>
                    {label}
                  </option>
                )
              })}
            </select>
            {state.errors?.policyId && <p className="text-xs text-red-500">{state.errors.policyId[0]}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" name="startDate" type="date" required defaultValue={defaultValues?.startDate} />
              {state.errors?.startDate && <p className="text-xs text-red-500">{state.errors.startDate[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" name="endDate" type="date" required defaultValue={defaultValues?.endDate} />
              {state.errors?.endDate && <p className="text-xs text-red-500">{state.errors.endDate[0]}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea id="reason" name="reason" placeholder="Provide reason for leave..." rows={3} defaultValue={defaultValues?.reason} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  )
}
