"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { proposeProject, type ProjectFormState } from "@/lib/actions/projects"

const initialState: ProjectFormState = {}

const selectClass =
  "w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"

export function ProjectForm({ departments }: { departments: { id: string; name: string }[] }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(proposeProject, initialState)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Project proposal submitted")
      router.push("/dashboard/projects")
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Proposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="departmentId">Department *</Label>
              <select
                id="departmentId"
                name="departmentId"
                required
                className={selectClass}
                defaultValue={departments.length === 1 ? departments[0].id : ""}
              >
                <option value="">Select department...</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {state.errors?.departmentId && <p className="text-xs text-red-500">{state.errors.departmentId[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fiscalYear">Fiscal Year *</Label>
              <select id="fiscalYear" name="fiscalYear" required className={selectClass} defaultValue={currentYear}>
                {[currentYear, currentYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Project Name *</Label>
            <Input id="name" name="name" required placeholder="e.g., Network Infrastructure Upgrade" />
            {state.errors?.name && <p className="text-xs text-red-500">{state.errors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proposedBudget">Proposed Budget (MWK) *</Label>
            <Input id="proposedBudget" name="proposedBudget" type="number" min="1" step="0.01" required />
            {state.errors?.proposedBudget && <p className="text-xs text-red-500">{state.errors.proposedBudget[0]}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Planned Start</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">Planned Completion</Label>
              <Input id="endDate" name="endDate" type="date" />
              {state.errors?.endDate && <p className="text-xs text-red-500">{state.errors.endDate[0]}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Scope and Justification *</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              required
              placeholder="Describe the objectives, deliverables and why the budget is needed..."
            />
            {state.errors?.description && <p className="text-xs text-red-500">{state.errors.description[0]}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit for Finance Review"}
        </Button>
      </div>
    </form>
  )
}
