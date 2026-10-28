"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PlayCircle, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createSalary, runPayroll, type PayrollFormState } from "@/lib/actions/payroll"

const initialState: PayrollFormState = {}

function useFormResult(state: PayrollFormState, onSuccess: () => void) {
  const router = useRouter()
  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Saved")
      onSuccess()
      router.refresh()
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])
}

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function RunPayrollDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(runPayroll, initialState)
  useFormResult(state, () => setOpen(false))

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="inline-flex items-center">
        <PlayCircle className="mr-2 h-4 w-4" />
        Run Payroll
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form action={formAction}>
            <DialogHeader>
              <DialogTitle>Run Monthly Payroll</DialogTitle>
              <DialogDescription>
                Generates payslips for all active employees with a salary record, applying PAYE, pension,
                loan repayments and other deductions for the month.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5 my-4">
              <Label htmlFor="period">Payroll Month</Label>
              <Input id="period" name="period" type="month" required defaultValue={currentPeriod()} max={currentPeriod()} />
              {state.errors?.period && <p className="text-xs text-red-500">{state.errors.period[0]}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Processing..." : "Process Payroll"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface SalaryDialogProps {
  employeeId: string
  employeeName: string
  salary?: { baseSalary: number; allowance: number; bonus: number; deductions: number } | null
}

export function SalaryDialog({ employeeId, employeeName, salary }: SalaryDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createSalary, initialState)
  useFormResult(state, () => setOpen(false))

  return (
    <>
      <Button size="sm" variant="outline" className="h-8" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5 mr-1" />
        {salary ? "Edit" : "Set Salary"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form action={formAction}>
            <DialogHeader>
              <DialogTitle>Salary — {employeeName}</DialogTitle>
              <DialogDescription>Monthly amounts in MWK. Changes apply from the next payroll run.</DialogDescription>
            </DialogHeader>
            <input type="hidden" name="employeeId" value={employeeId} />
            <div className="grid gap-4 sm:grid-cols-2 my-4">
              <div className="space-y-1.5">
                <Label htmlFor="baseSalary">Basic Salary *</Label>
                <Input id="baseSalary" name="baseSalary" type="number" min="0" step="0.01" required defaultValue={salary?.baseSalary} />
                {state.errors?.baseSalary && <p className="text-xs text-red-500">{state.errors.baseSalary[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="allowance">Allowances</Label>
                <Input id="allowance" name="allowance" type="number" min="0" step="0.01" defaultValue={salary?.allowance ?? 0} />
                {state.errors?.allowance && <p className="text-xs text-red-500">{state.errors.allowance[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bonus">Bonus</Label>
                <Input id="bonus" name="bonus" type="number" min="0" step="0.01" defaultValue={salary?.bonus ?? 0} />
                {state.errors?.bonus && <p className="text-xs text-red-500">{state.errors.bonus[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deductions">Other Fixed Deductions</Label>
                <Input id="deductions" name="deductions" type="number" min="0" step="0.01" defaultValue={salary?.deductions ?? 0} />
                {state.errors?.deductions && <p className="text-xs text-red-500">{state.errors.deductions[0]}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Salary"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
