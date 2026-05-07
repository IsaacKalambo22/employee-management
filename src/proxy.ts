import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request })
  const pathname = request.nextUrl.pathname

  // Basic authentication check for dashboard routes
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }

  // Role-based redirects for root dashboard
  if (pathname === "/dashboard") {
    switch (token?.role) {
      case "SUPER_ADMIN":
        return NextResponse.redirect(new URL("/dashboard/admin", request.url))
      case "HR_ADMIN":
        return NextResponse.redirect(new URL("/dashboard/hr", request.url))
      case "MANAGER":
        return NextResponse.redirect(new URL("/dashboard/manager", request.url))
      case "EMPLOYEE":
        return NextResponse.redirect(new URL("/dashboard/employee", request.url))
      default:
        return NextResponse.redirect(new URL("/dashboard/employee", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/protected/:path*",
  ]
}
