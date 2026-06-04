import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export type Role = "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE"

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 4,
  HR_ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
}

export const PERMISSIONS = {
  // User Management
  CREATE_USER: ["SUPER_ADMIN"],
  READ_USERS: ["SUPER_ADMIN", "HR_ADMIN"],
  UPDATE_USER: ["SUPER_ADMIN", "HR_ADMIN"],
  DELETE_USER: ["SUPER_ADMIN"],

  // Employee Management
  CREATE_EMPLOYEE: ["SUPER_ADMIN", "HR_ADMIN"],
  READ_EMPLOYEES: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  UPDATE_EMPLOYEE: ["SUPER_ADMIN", "HR_ADMIN"],
  DELETE_EMPLOYEE: ["SUPER_ADMIN", "HR_ADMIN"],
  MANAGE_EMPLOYEE_GRADE: ["SUPER_ADMIN", "HR_ADMIN"],
  MANAGE_EMPLOYEE_HIERARCHY: ["SUPER_ADMIN", "HR_ADMIN"],

  // Department Management
  CREATE_DEPARTMENT: ["SUPER_ADMIN", "HR_ADMIN"],
  READ_DEPARTMENTS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  UPDATE_DEPARTMENT: ["SUPER_ADMIN", "HR_ADMIN"],
  DELETE_DEPARTMENT: ["SUPER_ADMIN"],
  MANAGE_DEPARTMENT_BUDGET: ["SUPER_ADMIN", "HR_ADMIN"],

  // Leave Management
  CREATE_LEAVE_REQUEST: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  READ_LEAVE_REQUESTS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  READ_OWN_LEAVE: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  APPROVE_LEAVE_REQUEST: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  REJECT_LEAVE_REQUEST: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  MANAGE_LEAVE_POLICIES: ["SUPER_ADMIN", "HR_ADMIN"],
  MANAGE_LEAVE_BALANCES: ["SUPER_ADMIN", "HR_ADMIN"],

  // Requisition Management
  CREATE_REQUISITION: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  READ_REQUISITIONS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  READ_OWN_REQUISITIONS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  APPROVE_REQUISITION: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  PROCESS_REQUISITION: ["SUPER_ADMIN", "HR_ADMIN"],
  MANAGE_BUDGETS: ["SUPER_ADMIN", "HR_ADMIN"],
  CREATE_LPO: ["SUPER_ADMIN", "HR_ADMIN"],

  // Attendance
  CLOCK_IN: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  CLOCK_OUT: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  READ_ATTENDANCE: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  READ_OWN_ATTENDANCE: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  CORRECT_ATTENDANCE: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  READ_TEAM_ATTENDANCE: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],

  // Payroll
  CREATE_PAYROLL: ["SUPER_ADMIN", "HR_ADMIN"],
  READ_PAYROLL: ["SUPER_ADMIN", "HR_ADMIN"],
  UPDATE_PAYROLL: ["SUPER_ADMIN", "HR_ADMIN"],
  APPROVE_PAYROLL: ["SUPER_ADMIN"],
  VIEW_OWN_PAYSLIP: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  VIEW_SALARY_HISTORY: ["SUPER_ADMIN", "HR_ADMIN"],

  // System Settings
  MANAGE_SYSTEM_SETTINGS: ["SUPER_ADMIN"],
  VIEW_AUDIT_LOGS: ["SUPER_ADMIN", "HR_ADMIN"],

  // Workflow Management
  MANAGE_WORKFLOW_TEMPLATES: ["SUPER_ADMIN", "HR_ADMIN"],
  VIEW_WORKFLOW_HISTORY: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  APPROVE_WORKFLOW_STEP: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],

  // Reports
  READ_REPORTS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  GENERATE_REPORTS: ["SUPER_ADMIN", "HR_ADMIN"],
  VIEW_TEAM_REPORTS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],

  // Notifications
  MANAGE_NOTIFICATIONS: ["SUPER_ADMIN", "HR_ADMIN"],
  VIEW_NOTIFICATIONS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
}

// Route access control - which roles can access which routes
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/dashboard/admin":    ["SUPER_ADMIN"],
  "/dashboard/hr":       ["SUPER_ADMIN", "HR_ADMIN"],
  "/dashboard/manager":  ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  "/dashboard/employee": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/employees": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  "/dashboard/leave":    ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/requisitions": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/attendance": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/payroll":  ["SUPER_ADMIN", "HR_ADMIN"],
  "/dashboard/settings": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/finance":  ["SUPER_ADMIN", "HR_ADMIN"],
}

// Home dashboard per role
export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/dashboard/admin",
  HR_ADMIN:    "/dashboard/hr",
  MANAGER:     "/dashboard/manager",
  EMPLOYEE:    "/dashboard/employee",
}

// Sidebar navigation definition - each item declares which roles can see it
export const NAV_ITEMS = [
  {
    name: "Admin Dashboard",
    href: "/dashboard/admin",
    icon: "LayoutDashboard",
    roles: ["SUPER_ADMIN"] as Role[],
  },
  {
    name: "HR Dashboard",
    href: "/dashboard/hr",
    icon: "LayoutDashboard",
    roles: ["HR_ADMIN"] as Role[],
  },
  {
    name: "Manager Dashboard",
    href: "/dashboard/manager",
    icon: "LayoutDashboard",
    roles: ["MANAGER"] as Role[],
  },
  {
    name: "My Dashboard",
    href: "/dashboard/employee",
    icon: "LayoutDashboard",
    roles: ["EMPLOYEE"] as Role[],
  },
  {
    name: "Employees",
    href: "/dashboard/employees",
    icon: "Users",
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"] as Role[],
  },
  {
    name: "Leave",
    href: "/dashboard/leave",
    icon: "Calendar",
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"] as Role[],
  },
  {
    name: "Requisitions",
    href: "/dashboard/requisitions",
    icon: "FileText",
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"] as Role[],
  },
  {
    name: "Attendance",
    href: "/dashboard/attendance",
    icon: "Clock",
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"] as Role[],
  },
  {
    name: "Payroll",
    href: "/dashboard/payroll",
    icon: "DollarSign",
    roles: ["SUPER_ADMIN", "HR_ADMIN"] as Role[],
  },
  {
    name: "Finance",
    href: "/dashboard/finance",
    icon: "TrendingUp",
    roles: ["SUPER_ADMIN", "HR_ADMIN"] as Role[],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: "Settings",
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"] as Role[],
  },
]

// ─── Server-side helpers ──────────────────────────────────────────────────────

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function getUserRole(): Promise<Role | null> {
  const user = await getCurrentUser()
  return (user?.role as Role) || null
}

export async function hasPermission(permission: keyof typeof PERMISSIONS): Promise<boolean> {
  const role = await getUserRole()
  if (!role) return false
  return (PERMISSIONS[permission] as string[]).includes(role)
}

export async function requirePermission(permission: keyof typeof PERMISSIONS): Promise<void> {
  const allowed = await hasPermission(permission)
  if (!allowed) throw new Error("Forbidden: insufficient permissions")
}

export async function hasRole(role: Role): Promise<boolean> {
  const userRole = await getUserRole()
  return userRole === role
}

export async function hasMinimumRole(minimumRole: Role): Promise<boolean> {
  const userRole = await getUserRole()
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}

// ─── Sync helpers (for client components that already have role from session) ─

export function checkPermission(role: Role | string | null | undefined, permission: keyof typeof PERMISSIONS): boolean {
  if (!role) return false
  return (PERMISSIONS[permission] as string[]).includes(role)
}

export function canAccessRoute(role: Role | null, route: string): boolean {
  if (!role) return false
  return ROUTE_PERMISSIONS[route]?.includes(role) ?? false
}

export function getNavItemsForRole(role: Role | string | null | undefined): typeof NAV_ITEMS {
  if (!role) return []
  return NAV_ITEMS.filter((item) => (item.roles as string[]).includes(role))
}
