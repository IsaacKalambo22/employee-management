"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

interface AttendanceChartProps {
  data: Array<{ date: string; present: number; absent: number; late: number }>
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="present" fill="#00C49F" name="Present" />
        <Bar dataKey="absent" fill="#FF8042" name="Absent" />
        <Bar dataKey="late" fill="#FFBB28" name="Late" />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface LeaveChartProps {
  data: Array<{ month: string; approved: number; pending: number; rejected: number }>
}

export function LeaveChart({ data }: LeaveChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="approved" stackId="1" stroke="#00C49F" fill="#00C49F" name="Approved" />
        <Area type="monotone" dataKey="pending" stackId="1" stroke="#FFBB28" fill="#FFBB28" name="Pending" />
        <Area type="monotone" dataKey="rejected" stackId="1" stroke="#FF8042" fill="#FF8042" name="Rejected" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface DepartmentChartProps {
  data: Array<{ name: string; employees: number }>
}

export function DepartmentChart({ data }: DepartmentChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="employees"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface PayrollChartProps {
  data: Array<{ period: string; amount: number }>
}

export function PayrollChart({ data }: PayrollChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="amount" stroke="#0088FE" name="Total Payroll (MWK)" />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface RequisitionChartProps {
  data: Array<{ category: string; amount: number }>
}

export function RequisitionChart({ data }: RequisitionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="category" type="category" width={100} />
        <Tooltip />
        <Legend />
        <Bar dataKey="amount" fill="#8884D8" name="Amount (MWK)" />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface EmployeeGrowthChartProps {
  data: Array<{ month: string; newHires: number; totalEmployees: number }>
}

export function EmployeeGrowthChart({ data }: EmployeeGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="newHires" stroke="#00C49F" name="New Hires" />
        <Line type="monotone" dataKey="totalEmployees" stroke="#0088FE" name="Total Employees" />
      </LineChart>
    </ResponsiveContainer>
  )
}
