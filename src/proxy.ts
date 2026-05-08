import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Rate limiting store (in-memory for demo, use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100

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

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/protected/:path*",
  ]
}
