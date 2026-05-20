"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { EmployeeFormState } from "@/lib/actions/employees"
import { Eye, EyeOff } from "lucide-react"

interface Department { id: string; name: string }
interface Position { id: string; title: string }

interface EmployeeFormProps {
  action: (prevState: EmployeeFormState, formData: FormData) => Promise<EmployeeFormState>
  departments: Department[]
  positions: Position[]
  defaultValues?: {
    firstName?: string
    lastName?: string
    email?: string | null
    phone?: string | null
    departmentId?: string | null
    positionId?: string | null
    hireDate?: Date
    status?: string
  }
  submitLabel?: string
}

const initialState: EmployeeFormState = {}

export function EmployeeForm({ action, departments, positions, defaultValues, submitLabel = "Save Employee" }: EmployeeFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (state.success) {
      if (state.generatedPassword) {
        toast.success(
          `Employee created! Generated password: ${state.generatedPassword}`,
          { duration: 10000 }
        )
      } else {
        toast.success(state.message ?? "Saved successfully")
      }
      router.push("/dashboard/employees")
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, router])

  const formatDate = (date?: Date) => {
    if (!date) return ""
    return new Date(date).toISOString().split("T")[0]
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={defaultValues?.firstName ?? ""}
                  placeholder="John"
                />
                {state.errors?.firstName && (
                  <p className="text-xs text-red-500">{state.errors.firstName[0]}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={defaultValues?.lastName ?? ""}
                  placeholder="Smith"
                />
                {state.errors?.lastName && (
                  <p className="text-xs text-red-500">{state.errors.lastName[0]}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={defaultValues?.email ?? ""}
                placeholder="john.smith@company.com"
                required
              />
              {state.errors?.email && (
                <p className="text-xs text-red-500">{state.errors.email[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={defaultValues?.phone ?? ""}
                placeholder="+265 xxx xxx xxx"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="departmentId">Department</Label>
              <select
                id="departmentId"
                name="departmentId"
                defaultValue={defaultValues?.departmentId ?? ""}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="positionId">Position</Label>
              <select
                id="positionId"
                name="positionId"
                defaultValue={defaultValues?.positionId ?? ""}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select position...</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hireDate">Hire Date *</Label>
              <Input
                id="hireDate"
                name="hireDate"
                type="date"
                defaultValue={formatDate(defaultValues?.hireDate)}
              />
              {state.errors?.hireDate && (
                <p className="text-xs text-red-500">{state.errors.hireDate[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={defaultValues?.status ?? "ACTIVE"}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Login Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                defaultValue={defaultValues?.status ?? "EMPLOYEE"}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR_ADMIN">HR Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password (optional - leave blank to auto-generate)</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave blank to auto-generate a secure password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {state.errors?.password && (
                <p className="text-xs text-red-500">{state.errors.password[0]}</p>
              )}
              <p className="text-xs text-gray-500">If left blank, a secure 12-character password will be automatically generated and shown after creation.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
