"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PlayCircle, Pencil, RefreshCw } from "lucide-react"
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
import { createSalary, recalculatePayroll, runPayroll, type PayrollFormState } from "@/lib/actions/payroll"
import { calculatePayslip, formatMWK } from "@/lib/payroll/calculations"

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
                loan repayments and other deductions for the month. Running a month that has not yet been
                paid recalculates it using the current salaries.
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

export function RecalculatePayrollButton({ payrollId, period }: { payrollId: string; period: string }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    if (!confirm(`Recalculate the ${period} payroll using current salaries and deductions?`)) return
    setIsProcessing(true)
    const result = await recalculatePayroll(payrollId)
    setIsProcessing(false)
    if (result.success) {
      toast.success(result.message ?? "Payroll recalculated")
      router.refresh()
    } else {
      toast.error(result.message || "Failed to recalculate payroll")
    }
  }

  return (
    <Button size="sm" variant="outline" className="h-8" onClick={handleClick} disabled={isProcessing}>
      <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isProcessing ? "animate-spin" : ""}`} />
      {isProcessing ? "Recalculating..." : "Recalculate"}
    </Button>
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
  const [values, setValues] = useState({
    baseSalary: String(salary?.baseSalary ?? ""),
    allowance: String(salary?.allowance ?? 0),
    bonus: String(salary?.bonus ?? 0),
    deductions: String(salary?.deductions ?? 0),
  })
  useFormResult(state, () => setOpen(false))

  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }))

  // Same calculation the payroll run uses, so HR sees the payslip before saving
  const preview = calculatePayslip(
    {
      baseSalary: Number(values.baseSalary) || 0,
      allowance: Number(values.allowance) || 0,
      bonus: Number(values.bonus) || 0,
      standingDeduction: Number(values.deductions) || 0,
    },
    []
  )
  const pension = preview.items.find((i) => i.code === "PENSION")?.amount ?? 0

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
              <DialogDescription>
                Monthly amounts in MWK. PAYE and the 5% employee pension are calculated automatically.
              </DialogDescription>
            </DialogHeader>
            <input type="hidden" name="employeeId" value={employeeId} />
            <div className="grid gap-4 sm:grid-cols-2 my-4">
              <div className="space-y-1.5">
                <Label htmlFor="baseSalary">Basic Salary *</Label>
                <Input id="baseSalary" name="baseSalary" type="number" min="0" step="0.01" required value={values.baseSalary} onChange={set("baseSalary")} />
                {state.errors?.baseSalary && <p className="text-xs text-red-500">{state.errors.baseSalary[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="allowance">Allowances</Label>
                <Input id="allowance" name="allowance" type="number" min="0" step="0.01" value={values.allowance} onChange={set("allowance")} />
                {state.errors?.allowance && <p className="text-xs text-red-500">{state.errors.allowance[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bonus">Bonus</Label>
                <Input id="bonus" name="bonus" type="number" min="0" step="0.01" value={values.bonus} onChange={set("bonus")} />
                {state.errors?.bonus && <p className="text-xs text-red-500">{state.errors.bonus[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deductions">Other Fixed Deductions</Label>
                <Input id="deductions" name="deductions" type="number" min="0" step="0.01" value={values.deductions} onChange={set("deductions")} />
                <p className="text-xs text-muted-foreground">E.g. union dues or insurance. Do not include PAYE or pension.</p>
                {state.errors?.deductions && <p className="text-xs text-red-500">{state.errors.deductions[0]}</p>}
              </div>
            </div>

            <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1.5 mb-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Monthly payslip preview</p>
              <PreviewLine label="Gross Pay" amount={preview.grossPay} />
              <PreviewLine label="PAYE Tax" amount={-preview.tax} />
              <PreviewLine label="Pension (5% of basic)" amount={-pension} />
              <PreviewLine label="Other Deductions" amount={-(Number(values.deductions) || 0)} />
              <div className="flex justify-between border-t pt-1.5 font-semibold">
                <span>Net Pay</span>
                <span className="text-green-700">{formatMWK(preview.netPay)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Approved loan repayments are deducted in addition.</p>
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

function PreviewLine({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span>{amount < 0 ? `− ${formatMWK(-amount)}` : formatMWK(amount)}</span>
    </div>
  )
}
