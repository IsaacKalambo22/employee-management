import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, LogIn, LogOut, Calendar } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { clockIn, clockOut, getTodayAttendance, getEmployeeAttendance, getAttendanceReport } from "@/lib/actions/attendance"
import { ClockInForm } from "@/components/attendance/clock-in-form"
import { ClockOutForm } from "@/components/attendance/clock-out-form"


export default async function AttendancePage() {
  const session = await getServerSession(authOptions)
  const employeeId = session?.user?.employeeId

  const [todayAttendance, employeeAttendance, report] = await Promise.all([
    employeeId ? getTodayAttendance(employeeId) : [],
    employeeId ? getEmployeeAttendance(employeeId) : [],
    employeeId ? getAttendanceReport(employeeId, new Date().getMonth() + 1, new Date().getFullYear()) : null,
  ])

  const todayRecord = todayAttendance[0]
  const stats = report?.statistics

  const statusConfig: Record<string, { label: string; color: string }> = {
    PRESENT: { label: "Present", color: "bg-green-100 text-green-700" },
    ABSENT: { label: "Absent", color: "bg-red-100 text-red-700" },
    LATE: { label: "Late", color: "bg-yellow-100 text-yellow-700" },
    EARLY_DEPARTURE: { label: "Early Departure", color: "bg-orange-100 text-orange-700" },
    HALF_DAY: { label: "Half Day", color: "bg-blue-100 text-blue-700" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 text-sm mt-1">Track and manage attendance records</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Today's Status</CardDescription>
          </CardHeader>
          <CardContent>
            {todayRecord ? (
              <Badge className={statusConfig[todayRecord.status]?.color || "bg-gray-100 text-gray-700"}>
                {statusConfig[todayRecord.status]?.label || todayRecord.status}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">Not Clocked In</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats?.presentDays || 0} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Late Arrivals</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats?.lateDays || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Attendance Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats?.attendanceRate.toFixed(1) || 0}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clock In / Out</CardTitle>
          <CardDescription>Record your attendance for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <ClockInForm />
            <ClockOutForm />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {employeeAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No attendance records yet</p>
              <p className="text-xs mt-1">Clock in to start recording attendance</p>
            </div>
          ) : (
            <div className="space-y-2">
              {employeeAttendance.slice(0, 10).map((record: any) => {
                const config = statusConfig[record.status] || statusConfig.ABSENT
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.clockIn ? `In: ${new Date(record.clockIn).toLocaleTimeString()}` : "Not clocked in"}
                          {record.clockOut && ` • Out: ${new Date(record.clockOut).toLocaleTimeString()}`}
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
