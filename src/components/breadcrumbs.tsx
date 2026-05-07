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
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathname === "/dashboard") return []
    
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    
    segments.forEach((segment, index) => {
      if (segment === "dashboard") {
        breadcrumbs.push({ label: "Dashboard", href: "/dashboard" })
      } else if (segment === "admin") {
        breadcrumbs.push({ label: "Admin", href: "/dashboard/admin" })
      } else if (segment === "hr") {
        breadcrumbs.push({ label: "HR", href: "/dashboard/hr" })
      } else if (segment === "manager") {
        breadcrumbs.push({ label: "Manager", href: "/dashboard/manager" })
      } else if (segment === "employee") {
        breadcrumbs.push({ label: "Employee", href: "/dashboard/employee" })
      } else if (segment === "employees") {
        breadcrumbs.push({ label: "Employees", href: "/dashboard/employees" })
      } else if (segment === "leave") {
        breadcrumbs.push({ label: "Leave", href: "/dashboard/leave" })
      } else if (segment === "requisitions") {
        breadcrumbs.push({ label: "Requisitions", href: "/dashboard/requisitions" })
      } else if (segment === "attendance") {
        breadcrumbs.push({ label: "Attendance", href: "/dashboard/attendance" })
      } else if (segment === "payroll") {
        breadcrumbs.push({ label: "Payroll", href: "/dashboard/payroll" })
      } else if (segment === "settings") {
        breadcrumbs.push({ label: "Settings", href: "/dashboard/settings" })
      } else {
        breadcrumbs.push({ label: segment.charAt(0).toUpperCase() + segment.slice(1) })
      }
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
