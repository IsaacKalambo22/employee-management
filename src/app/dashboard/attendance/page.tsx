import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, LogIn, LogOut } from "lucide-react"

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 text-sm mt-1">Track and manage attendance records</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Status", value: "Not Clocked In", color: "text-yellow-600" },
          { label: "This Month", value: "0 days", color: "text-blue-600" },
          { label: "Late Arrivals", value: "0", color: "text-red-600" },
          { label: "Attendance Rate", value: "N/A", color: "text-green-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">{item.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clock In / Out</CardTitle>
          <CardDescription>Record your attendance for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" variant="default">
              <LogIn className="mr-2 h-4 w-4" />
              Clock In
            </Button>
            <Button className="flex-1" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Clock Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Clock className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No attendance records yet</p>
            <p className="text-xs mt-1">Clock in to start recording attendance</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
