"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getNavItemsForRole } from "@/lib/permissions"
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Clock,
  DollarSign,
  Settings,
  TrendingUp,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Clock,
  DollarSign,
  Settings,
  TrendingUp,
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Admin",
  HR_ADMIN: "HR Officer",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
}

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  HR_ADMIN: "bg-purple-100 text-purple-700",
  MANAGER: "bg-blue-100 text-blue-700",
  EMPLOYEE: "bg-green-100 text-green-700",
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const navItems = getNavItemsForRole(role)

  return (
    <div className="flex flex-col w-64 h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-lg border-r border-slate-200">
      <div className="flex flex-col items-center justify-center h-20 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 px-4">
        <h1 className="text-xl font-bold text-white">HR System</h1>
        {role && (
          <Badge className={cn("mt-1 text-xs", ROLE_COLOR[role] ?? "bg-gray-100 text-gray-700")}>
            {ROLE_LABEL[role] ?? role}
          </Badge>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 px-3",
                  isActive && "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md",
                  !isActive && "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
      {session?.user && (
        <div className="p-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
        </div>
      )}
    </div>
  )
}
