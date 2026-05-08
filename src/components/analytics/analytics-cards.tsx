"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, Calendar, DollarSign, FileText, TrendingUp } from "lucide-react"

interface AnalyticsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function AnalyticsCard({ title, value, description, icon, trend }: AnalyticsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs flex items-center gap-2">
          {icon}
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className={`h-3 w-3 ${trend.isPositive ? "text-green-600" : "text-red-600"}`} />
            <span className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function EmployeeAnalyticsCards({ analytics }: { analytics: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnalyticsCard
        title="Total Employees"
        value={analytics.totalEmployees}
        icon={<Users className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Active Employees"
        value={analytics.activeEmployees}
        icon={<Users className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Inactive Employees"
        value={analytics.inactiveEmployees}
        icon={<Users className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="New Hires (This Month)"
        value={analytics.newHiresThisMonth}
        icon={<TrendingUp className="h-3 w-3" />}
      />
    </div>
  )
}

export function AttendanceAnalyticsCards({ analytics }: { analytics: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnalyticsCard
        title="Present"
        value={analytics.present}
        icon={<Clock className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Absent"
        value={analytics.absent}
        icon={<Clock className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Late"
        value={analytics.late}
        icon={<Clock className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Attendance Rate"
        value={`${analytics.attendanceRate.toFixed(1)}%`}
        icon={<TrendingUp className="h-3 w-3" />}
      />
    </div>
  )
}

export function LeaveAnalyticsCards({ analytics }: { analytics: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnalyticsCard
        title="Approved"
        value={analytics.approved}
        icon={<Calendar className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Pending"
        value={analytics.pending}
        icon={<Calendar className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Rejected"
        value={analytics.rejected}
        icon={<Calendar className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Total Requests"
        value={analytics.total}
        icon={<FileText className="h-3 w-3" />}
      />
    </div>
  )
}

export function RequisitionAnalyticsCards({ analytics }: { analytics: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnalyticsCard
        title="Approved"
        value={analytics.approved}
        icon={<FileText className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Pending"
        value={analytics.pending}
        icon={<FileText className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Rejected"
        value={analytics.rejected}
        icon={<FileText className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Total Amount"
        value={`MWK ${analytics.totalAmount.toLocaleString()}`}
        icon={<DollarSign className="h-3 w-3" />}
      />
    </div>
  )
}

export function PayrollAnalyticsCards({ analytics }: { analytics: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnalyticsCard
        title="Total Gross Pay"
        value={`MWK ${analytics.totalGrossPay.toLocaleString()}`}
        icon={<DollarSign className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Total Net Pay"
        value={`MWK ${analytics.totalNetPay.toLocaleString()}`}
        icon={<DollarSign className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Total Tax"
        value={`MWK ${analytics.totalTax.toLocaleString()}`}
        icon={<DollarSign className="h-3 w-3" />}
      />
      <AnalyticsCard
        title="Average Net Pay"
        value={`MWK ${analytics.averageNetPay.toLocaleString()}`}
        icon={<TrendingUp className="h-3 w-3" />}
      />
    </div>
  )
}
