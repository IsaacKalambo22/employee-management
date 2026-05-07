import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar } from "lucide-react"

export default function LeavePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage leave requests and approvals</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Apply for Leave
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Annual Leave Balance", value: "21 days", color: "text-blue-600" },
          { label: "Sick Leave Balance", value: "10 days", color: "text-green-600" },
          { label: "Pending Requests", value: "0", color: "text-yellow-600" },
          { label: "Approved This Year", value: "0 days", color: "text-purple-600" },
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
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>All submitted leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No leave requests yet</p>
            <p className="text-xs mt-1">Submit a leave request to get started</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
