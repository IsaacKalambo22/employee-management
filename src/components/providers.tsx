"use client"

import { SessionProvider } from "next-auth/react"
import { RouterGuard } from "./router-guard"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RouterGuard>
        {children}
      </RouterGuard>
    </SessionProvider>
  )
}
