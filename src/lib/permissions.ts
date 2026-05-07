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
  UPDATE_EMPLOYEE: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  DELETE_EMPLOYEE: ["SUPER_ADMIN", "HR_ADMIN"],

  // Department Management
  CREATE_DEPARTMENT: ["SUPER_ADMIN", "HR_ADMIN"],
  READ_DEPARTMENTS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  UPDATE_DEPARTMENT: ["SUPER_ADMIN", "HR_ADMIN"],
  DELETE_DEPARTMENT: ["SUPER_ADMIN"],

  // Leave Management
  CREATE_LEAVE_REQUEST: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  READ_LEAVE_REQUESTS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  APPROVE_LEAVE_REQUEST: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  REJECT_LEAVE_REQUEST: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],

  // Requisition Management
  CREATE_REQUISITION: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  READ_REQUISITIONS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  APPROVE_REQUISITION: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  PROCESS_REQUISITION: ["SUPER_ADMIN", "HR_ADMIN"],

  // Attendance
  CLOCK_IN: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  CLOCK_OUT: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  READ_ATTENDANCE: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  CORRECT_ATTENDANCE: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],

  // Payroll
  CREATE_PAYROLL: ["SUPER_ADMIN", "HR_ADMIN"],
  READ_PAYROLL: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  UPDATE_PAYROLL: ["SUPER_ADMIN", "HR_ADMIN"],
  APPROVE_PAYROLL: ["SUPER_ADMIN"],

  // Reports
  READ_REPORTS: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  GENERATE_REPORTS: ["SUPER_ADMIN", "HR_ADMIN"],
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function getUserRole(): Promise<Role | null> {
  const user = await getCurrentUser()
  return user?.role as Role || null
}

export async function hasPermission(permission: keyof typeof PERMISSIONS): Promise<boolean> {
  const role = await getUserRole()
  if (!role) return false
  
  return PERMISSIONS[permission].includes(role)
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

export function canAccessRoute(role: Role | null, route: string): boolean {
  if (!role) return false

  const routePermissions: Record<string, Role[]> = {
    "/dashboard/admin": ["SUPER_ADMIN"],
    "/dashboard/hr": ["SUPER_ADMIN", "HR_ADMIN"],
    "/dashboard/manager": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
    "/dashboard/employee": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
    "/dashboard/employees": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
    "/dashboard/leave": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
    "/dashboard/requisitions": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
    "/dashboard/attendance": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
    "/dashboard/payroll": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
    "/dashboard/settings": ["SUPER_ADMIN"],
  }

  return routePermissions[route]?.includes(role) || false
}
