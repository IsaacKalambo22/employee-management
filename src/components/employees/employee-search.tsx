"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface Department {
  id: string
  name: string
}

interface EmployeeSearchProps {
  departments: Department[]
}

export function EmployeeSearch({ departments }: EmployeeSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      return params.toString()
    },
    [searchParams]
  )

  const currentSearch = searchParams.get("search") ?? ""
  const currentDept = searchParams.get("departmentId") ?? ""
  const hasFilters = currentSearch || currentDept

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          defaultValue={currentSearch}
          placeholder="Search by name or email..."
          className="pl-8"
          onChange={(e) => {
            router.push(pathname + "?" + createQueryString({ search: e.target.value, departmentId: currentDept || null }))
          }}
        />
      </div>
      <select
        value={currentDept}
        onChange={(e) => {
          router.push(pathname + "?" + createQueryString({ departmentId: e.target.value || null, search: currentSearch || null }))
        }}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-[200px]"
      >
        <option value="">All Departments</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
          className="gap-1.5 text-muted-foreground"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
