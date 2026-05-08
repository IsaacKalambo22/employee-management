import { z } from "zod"

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address").min(1, "Email is required")
export const phoneSchema = z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid phone number").optional()
export const nameSchema = z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long")
export const dateSchema = z.string().or(z.date())
export const amountSchema = z.number().min(0, "Amount must be positive")

// Employee validation
export const employeeSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  hireDate: z.string().min(1, "Hire date is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]),
})

// Leave request validation
export const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  policyId: z.string().min(1, "Leave policy is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  days: z.number().min(1, "At least 1 day is required"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason is too long"),
})

// Requisition validation
export const requisitionSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  category: z.string().min(1, "Category is required"),
  amount: amountSchema,
  description: z.string().min(1, "Description is required").max(1000, "Description is too long"),
})

// Attendance validation
export const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  date: z.string().min(1, "Date is required"),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EARLY_DEPARTURE", "HALF_DAY"]),
})

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Validate and sanitize object
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value)
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}
