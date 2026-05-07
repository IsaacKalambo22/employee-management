import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, CheckCircle, Clock, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRequisitions } from "@/lib/actions/requisitions"

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  MANAGER_APPROVED: { label: "Manager Approved", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  FINANCE_APPROVED: { label: "Finance Approved", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: XCircle },
}

export default async function RequisitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const session = await getServerSession(authOptions)
  const requisitions = await getRequisitions(params.status)

  const pending = requisitions.filter((r: any) => r.status === "PENDING").length
  const approved = requisitions.filter((r: any) => r.status === "APPROVED").length
  const rejected = requisitions.filter((r: any) => r.status === "REJECTED").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Requisitions</h1>
          <p className="text-gray-600 text-sm mt-1">Submit and track requisition requests</p>
        </div>
        {session?.user.employeeId && (
          <Link href="/dashboard/requisitions/new" className={cn(buttonVariants({ size: "sm" }), "inline-flex items-center")}>
            <Plus className="mr-2 h-4 w-4" />
            New Requisition
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{rejected}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requisitions</CardTitle>
          <CardDescription>{requisitions.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {requisitions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No requisitions yet</p>
              <p className="text-xs mt-1">Submit a requisition to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requisitions.map((r: any) => {
                const config = statusConfig[r.status] || statusConfig.PENDING
                const Icon = config.icon
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("p-2 rounded-full", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.employee.firstName} {r.employee.lastName} • {r.employee.department?.name ?? "No dept"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.category} {r.amount ? `• MWK ${r.amount}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
