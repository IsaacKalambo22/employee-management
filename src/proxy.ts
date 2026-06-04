import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Rate limiting store (in-memory for demo, use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100

// Route-specific role requirements
const ROUTE_ROLE_MAP: Record<string, string[]> = {
  "/dashboard/admin":      ["SUPER_ADMIN"],
  "/dashboard/hr":         ["SUPER_ADMIN", "HR_ADMIN"],
  "/dashboard/manager":    ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  "/dashboard/employees":  ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  "/dashboard/payroll":    ["SUPER_ADMIN", "HR_ADMIN"],
  "/dashboard/finance":    ["SUPER_ADMIN", "HR_ADMIN"],
}

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/dashboard/admin",
  HR_ADMIN:    "/dashboard/hr",
  MANAGER:     "/dashboard/manager",
  EMPLOYEE:    "/dashboard/employee",
}

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'
  return ip
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = rateLimit.get(key)

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const token = await getToken({ req: request })
  const pathname = request.nextUrl.pathname
  const role: string = token?.role ?? ""

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request)
    if (!checkRateLimit(key)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  // Basic authentication check for dashboard routes
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }

  // Redirect bare /dashboard to role home
  if (pathname === "/dashboard") {
    const home = ROLE_HOME[role] ?? "/dashboard/employee"
    return NextResponse.redirect(new URL(home, request.url))
  }

  // Check route-specific role requirements
  for (const [route, allowedRoles] of Object.entries(ROUTE_ROLE_MAP)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
      const home = ROLE_HOME[role] ?? "/dashboard/employee"
      return NextResponse.redirect(new URL(home, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/protected/:path*",
  ]
}
