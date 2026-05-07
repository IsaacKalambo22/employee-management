"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const EmployeeSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  positionId: z.string().optional().or(z.literal("")),
  hireDate: z.string().min(1, "Hire date is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED", "ON_LEAVE"]).default("ACTIVE"),
})

export type EmployeeFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function getEmployees(search?: string, departmentId?: string) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  return prisma.employee.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        departmentId ? { departmentId } : {},
      ],
    },
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getEmployee(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  return prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      position: true,
      documents: true,
      emergencyContacts: true,
      user: { select: { id: true, email: true, role: true } },
    },
  })
}

export async function getDepartments() {
  return prisma.department.findMany({ orderBy: { name: "asc" } })
}

export async function getPositions() {
  return prisma.position.findMany({ orderBy: { title: "asc" } })
}

export async function createEmployee(
  prevState: EmployeeFormState,
  formData: FormData
): Promise<EmployeeFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    departmentId: formData.get("departmentId") as string,
    positionId: formData.get("positionId") as string,
    hireDate: formData.get("hireDate") as string,
    status: formData.get("status") as string,
  }

  const parsed = EmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { firstName, lastName, email, phone, departmentId, positionId, hireDate, status } = parsed.data

  try {
    await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        departmentId: departmentId || null,
        positionId: positionId || null,
        hireDate: new Date(hireDate),
        status,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE",
        entityType: "Employee",
        entityId: "new",
        metadata: { firstName, lastName, email },
      },
    })
  } catch (e) {
    return { message: "Failed to create employee. Email may already exist." }
  }

  revalidatePath("/dashboard/employees")
  return { success: true, message: "Employee created successfully" }
}

export async function updateEmployee(
  id: string,
  prevState: EmployeeFormState,
  formData: FormData
): Promise<EmployeeFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    departmentId: formData.get("departmentId") as string,
    positionId: formData.get("positionId") as string,
    hireDate: formData.get("hireDate") as string,
    status: formData.get("status") as string,
  }

  const parsed = EmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { firstName, lastName, email, phone, departmentId, positionId, hireDate, status } = parsed.data

  try {
    await prisma.employee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        departmentId: departmentId || null,
        positionId: positionId || null,
        hireDate: new Date(hireDate),
        status,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "Employee",
        entityId: id,
        metadata: { firstName, lastName },
      },
    })
  } catch (e) {
    return { message: "Failed to update employee." }
  }

  revalidatePath("/dashboard/employees")
  revalidatePath(`/dashboard/employees/${id}`)
  return { success: true, message: "Employee updated successfully" }
}

export async function deleteEmployee(id: string): Promise<EmployeeFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    await prisma.employee.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DELETE",
        entityType: "Employee",
        entityId: id,
        metadata: {},
      },
    })
  } catch (e) {
    return { message: "Failed to delete employee. They may have related records." }
  }

  revalidatePath("/dashboard/employees")
  return { success: true }
}
