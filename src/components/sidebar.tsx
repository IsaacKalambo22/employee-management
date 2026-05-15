"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Calendar, 
  FileText, 
  Clock, 
  DollarSign, 
  Settings,
  Home
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Employees", href: "/dashboard/employees", icon: Users },
  { name: "Leave", href: "/dashboard/leave", icon: Calendar },
  { name: "Requisitions", href: "/dashboard/requisitions", icon: FileText },
  { name: "Attendance", href: "/dashboard/attendance", icon: Clock },
  { name: "Payroll", href: "/dashboard/payroll", icon: DollarSign },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 h-full bg-gradient-to-b from-slate-50 to-slate-100 shadow-lg border-r border-slate-200">
      <div className="flex items-center justify-center h-16 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600">
        <h1 className="text-xl font-bold text-white">HR System</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 px-3",
                  isActive && "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md",
                  !isActive && "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
