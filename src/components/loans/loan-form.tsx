"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { LoanFormState } from "@/lib/actions/loans"
import { applyForLoan } from "@/lib/actions/loans"
import {
  LOAN_MAX_INSTALLMENT_RATIO,
  LOAN_MAX_SALARY_MULTIPLE,
  LOAN_MAX_TERM_MONTHS,
  calculateLoanInstallment,
  formatMWK,
} from "@/lib/payroll/calculations"

const initialState: LoanFormState = {}

export function LoanForm({ monthlyGross }: { monthlyGross: number }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(applyForLoan, initialState)
  const [amount, setAmount] = useState("")
  const [term, setTerm] = useState("12")

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Loan application submitted")
      router.push("/dashboard/loans")
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, router])

  const maxPrincipal = monthlyGross * LOAN_MAX_SALARY_MULTIPLE
  const maxInstallment = monthlyGross * LOAN_MAX_INSTALLMENT_RATIO
  const installment = calculateLoanInstallment(Number(amount) || 0, Number(term) || 0)
  const overLimit = installment > maxInstallment || Number(amount) > maxPrincipal

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount Requested (MWK) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  max={maxPrincipal}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {state.errors?.amount && <p className="text-xs text-red-500">{state.errors.amount[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="termMonths">Repayment Term (months) *</Label>
                <select
                  id="termMonths"
                  name="termMonths"
                  required
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {Array.from({ length: LOAN_MAX_TERM_MONTHS }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m} {m === 1 ? "month" : "months"}
                    </option>
                  ))}
                </select>
                {state.errors?.termMonths && <p className="text-xs text-red-500">{state.errors.termMonths[0]}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose *</Label>
              <Textarea
                id="purpose"
                name="purpose"
                rows={4}
                required
                placeholder="Briefly explain what the loan is for..."
              />
              {state.errors?.purpose && <p className="text-xs text-red-500">{state.errors.purpose[0]}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repayment Summary</CardTitle>
            <CardDescription>Interest-free, recovered through payroll</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly installment</span>
              <span className={overLimit ? "font-semibold text-red-600" : "font-semibold"}>{formatMWK(installment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maximum installment</span>
              <span>{formatMWK(maxInstallment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maximum loan</span>
              <span>{formatMWK(maxPrincipal)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Repayments start from the payroll month after approval. Installments may not exceed one third of
              your monthly gross pay of {formatMWK(monthlyGross)}.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || overLimit}>
          {isPending ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </form>
  )
}
