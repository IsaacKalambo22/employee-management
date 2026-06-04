"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { seedLeavePoliciesAndBalances } from "@/lib/actions/admin"
import { toast } from "sonner"
import { RefreshCw, Calendar } from "lucide-react"

export function SystemTools() {
  const [seeding, setSeeding] = useState(false)

  async function handleSeedLeave() {
    setSeeding(true)
    const result = await seedLeavePoliciesAndBalances()
    setSeeding(false)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          System Tools
        </CardTitle>
        <CardDescription>Maintenance actions for HR data integrity</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeedLeave}
          disabled={seeding}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          {seeding ? "Seeding…" : "Seed Leave Policies & Backfill Balances"}
        </Button>
      </CardContent>
    </Card>
  )
}
