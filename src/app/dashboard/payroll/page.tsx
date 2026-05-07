import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Payroll</h1>
        <p className="text-gray-600 text-sm mt-1">Manage payroll and salary processing</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Last Payslip", value: "Not generated", color: "text-gray-600" },
          { label: "Next Payroll Date", value: "End of month", color: "text-blue-600" },
          { label: "YTD Earnings", value: "MWK 0", color: "text-green-600" },
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
          <CardTitle>Payslips</CardTitle>
          <CardDescription>Your payslip history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <DollarSign className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No payslips available yet</p>
            <p className="text-xs mt-1">Payslips will appear here after processing</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
