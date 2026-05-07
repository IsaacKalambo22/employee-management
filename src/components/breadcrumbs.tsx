"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs() {
  const pathname = usePathname()
  
  const segmentMap: Record<string, string> = {
    dashboard: "Dashboard",
    admin: "Admin",
    hr: "HR",
    manager: "Manager",
    employee: "Employee",
    employees: "Employees",
    leave: "Leave",
    requisitions: "Requisitions",
    attendance: "Attendance",
    payroll: "Payroll",
    settings: "Settings",
  }

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathname === "/dashboard") return []

    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    let accumulatedPath = ""

    segments.forEach((segment) => {
      accumulatedPath += `/${segment}`
      const label = segmentMap[segment] ?? (segment.charAt(0).toUpperCase() + segment.slice(1))
      breadcrumbs.push({ label, href: accumulatedPath })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()
  
  if (breadcrumbs.length === 0) return null

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                "hover:text-foreground transition-colors",
                index === breadcrumbs.length - 1 && "text-foreground font-medium"
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(index === breadcrumbs.length - 1 && "text-foreground font-medium")}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
