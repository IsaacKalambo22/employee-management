"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard/finance", label: "Department Budgets" },
  { href: "/dashboard/finance/utilization", label: "Budget Utilization" },
  { href: "/dashboard/finance/approvals", label: "Pending Approvals" },
]

export function FinanceTabs({ pendingCount }: { pendingCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            {tab.label}
            {tab.href.endsWith("approvals") && !!pendingCount && (
              <span className="ml-2 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs">{pendingCount}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
