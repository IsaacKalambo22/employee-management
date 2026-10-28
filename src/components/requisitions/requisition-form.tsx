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
import type { RequisitionFormState } from "@/lib/actions/requisitions"

interface RequisitionFormProps {
  action: (prevState: RequisitionFormState, formData: FormData) => Promise<RequisitionFormState>
  defaultValues?: {
    title: string
    description: string
    amount: string
    category: string
    projectId?: string
  }
  projects?: { id: string; name: string; remaining: number }[]
}

const initialState: RequisitionFormState = {}

const categories = ["Office Supplies", "Equipment", "Travel", "Training", "Software", "Other"]

export function RequisitionForm({ action, defaultValues, projects = [] }: RequisitionFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Requisition submitted")
      router.push("/dashboard/requisitions")
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisition Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" placeholder="e.g., Office Supplies for Q2" required defaultValue={defaultValues?.title} />
            {state.errors?.title && <p className="text-xs text-red-500">{state.errors.title[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              name="category"
              required
              defaultValue={defaultValues?.category}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select category...</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {state.errors?.category && <p className="text-xs text-red-500">{state.errors.category[0]}</p>}
          </div>
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="projectId">Charge to Project</Label>
              <select
                id="projectId"
                name="projectId"
                defaultValue={defaultValues?.projectId ?? ""}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Not linked to a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — MWK {p.remaining.toLocaleString()} available
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Approved spend is deducted from the project&apos;s budget.</p>
              {state.errors?.projectId && <p className="text-xs text-red-500">{state.errors.projectId[0]}</p>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Estimated Amount (MWK)</Label>
            <Input id="amount" name="amount" type="number" placeholder="0.00" min="0" step="0.01" defaultValue={defaultValues?.amount} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" name="description" placeholder="Describe the items or services needed..." rows={4} required defaultValue={defaultValues?.description} />
            {state.errors?.description && <p className="text-xs text-red-500">{state.errors.description[0]}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Requisition"}
        </Button>
      </div>
    </form>
  )
}
