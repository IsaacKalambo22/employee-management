"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface RouterGuardProps {
  children: React.ReactNode
}

export function RouterGuard({ children }: RouterGuardProps) {
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Wait for router to be ready
    const checkReady = () => {
      if (router) {
        setIsReady(true)
      }
    }

    // Small delay to ensure router is initialized
    const timeout = setTimeout(checkReady, 100)

    return () => clearTimeout(timeout)
  }, [router])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <>{children}</>
}
