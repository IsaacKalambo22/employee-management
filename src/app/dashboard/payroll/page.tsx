import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, FileText } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPayrolls, getPayslips } from "@/lib/actions/payroll"

export default async function PayrollPage() {
  const session = await getServerSession(authOptions)
  const employeeId = session?.user?.employeeId

  const [payrolls, payslips] = await Promise.all([
    getPayrolls(),
    employeeId ? getPayslips(employeeId) : [],
  ])

  const lastPayslip = payslips[0]
  const ytdEarnings = payslips.reduce((sum: number, p: any) => sum + Number(p.netPay), 0)

  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-700" },
    PROCESSED: { label: "Processed", color: "bg-green-100 text-green-700" },
    PAID: { label: "Paid", color: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Payroll</h1>
        <p className="text-gray-600 text-sm mt-1">Manage payroll and salary processing</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Last Payslip</CardDescription>
          </CardHeader>
          <CardContent>
            {lastPayslip ? (
              <p className="text-sm font-medium">{new Date(lastPayslip.createdAt).toLocaleDateString()}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not generated</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Next Payroll Date</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-blue-600">End of month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">YTD Earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">MWK {ytdEarnings.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
          <CardDescription>Your payslip history</CardDescription>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <DollarSign className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No payslips available yet</p>
              <p className="text-xs mt-1">Payslips will appear here after processing</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payslips.slice(0, 10).map((payslip: any) => (
                <div key={payslip.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{payslip.payroll?.period || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Net: MWK {Number(payslip.netPay).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline">MWK {Number(payslip.netPay).toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {session?.user?.role === "HR_ADMIN" || session?.user?.role === "SUPER_ADMIN" ? (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Management</CardTitle>
            <CardDescription>Process and manage payroll periods</CardDescription>
          </CardHeader>
          <CardContent>
            {payrolls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No payroll periods yet</p>
                <p className="text-xs mt-1">Process your first payroll period</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payrolls.map((payroll: any) => {
                  const config = statusConfig[payroll.status] || statusConfig.PENDING
                  return (
                    <div key={payroll.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{payroll.period}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payroll.startDate).toLocaleDateString()} - {new Date(payroll.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>{config.label}</Badge>
                        <span className="text-xs text-muted-foreground">{payroll.payslips?.length || 0} employees</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
