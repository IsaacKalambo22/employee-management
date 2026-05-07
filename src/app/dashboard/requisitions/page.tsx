import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"

export default function RequisitionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Requisitions</h1>
          <p className="text-gray-600 text-sm mt-1">Submit and track requisition requests</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Requisition
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", value: "0", color: "text-yellow-600" },
          { label: "Approved", value: "0", color: "text-green-600" },
          { label: "Rejected", value: "0", color: "text-red-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">{item.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Requisitions</CardTitle>
          <CardDescription>All your submitted requisitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No requisitions yet</p>
            <p className="text-xs mt-1">Submit a requisition to get started</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
