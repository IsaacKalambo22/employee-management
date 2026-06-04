import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ROUTE_ROLE_MAP: Record<string, string[]> = {
  "/dashboard/admin":      ["SUPER_ADMIN"],
  "/dashboard/hr":         ["SUPER_ADMIN", "HR_ADMIN"],
  "/dashboard/manager":    ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  "/dashboard/employees":  ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  "/dashboard/payroll":    ["SUPER_ADMIN", "HR_ADMIN"],
  "/dashboard/finance":    ["SUPER_ADMIN", "HR_ADMIN"],
  "/dashboard/settings":   ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
}

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/dashboard/admin",
  HR_ADMIN:    "/dashboard/hr",
  MANAGER:     "/dashboard/manager",
  EMPLOYEE:    "/dashboard/employee",
}

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl
    const token = (req as any).nextauth?.token
    const role: string = token?.role ?? ""

    // Redirect bare /dashboard to role home
    if (pathname === "/dashboard") {
      const home = ROLE_HOME[role] ?? "/dashboard/employee"
      return NextResponse.redirect(new URL(home, req.url))
    }

    // Check route-specific role requirements
    for (const [route, allowedRoles] of Object.entries(ROUTE_ROLE_MAP)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        const home = ROLE_HOME[role] ?? "/dashboard/employee"
        return NextResponse.redirect(new URL(home, req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }: { token: any }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*"],
}
