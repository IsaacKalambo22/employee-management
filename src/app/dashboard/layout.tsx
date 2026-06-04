"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Menu, X, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "sonner"
import { ROUTE_PERMISSIONS, ROLE_HOME, type Role } from "@/lib/permissions"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role as Role

      // Check if the current path requires specific roles
      const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find((route) =>
        pathname.startsWith(route)
      )

      if (matchedRoute) {
        const allowed = ROUTE_PERMISSIONS[matchedRoute]?.includes(role) ?? true
        if (!allowed) {
          setAccessDenied(true)
          return
        }
      }

      setAccessDenied(false)

      // Redirect bare /dashboard to role home
      if (pathname === "/dashboard") {
        router.replace(ROLE_HOME[role] ?? "/dashboard/employee")
      }
    }
  }, [status, session, pathname, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (accessDenied) {
    const role = session.user.role as Role
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500">You don't have permission to access this page.</p>
          <Button onClick={() => router.push(ROLE_HOME[role] ?? "/dashboard/employee")}>
            Go to My Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </Header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
