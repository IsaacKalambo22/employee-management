"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Update profile schema
const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
})

// Change password schema
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

// Update user profile
export async function updateProfile(data: z.infer<typeof UpdateProfileSchema>) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const validatedData = UpdateProfileSchema.parse(data)

    // Get user with employee relation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employee: true },
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Update employee profile
    if (user.employee) {
      await prisma.employee.update({
        where: { id: user.employee.id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone || user.employee.phone,
        },
      })
    }

    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard/employee")

    return { success: true, message: "Profile updated successfully" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0].message }
    }
    console.error("Error updating profile:", error)
    return { success: false, message: "Failed to update profile" }
  }
}

// Change password
export async function changePassword(data: z.infer<typeof ChangePasswordSchema>) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const validatedData = ChangePasswordSchema.parse(data)

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Verify current password
    if (!user.password) {
      return { success: false, message: "Password not set for user" }
    }

    const isValidPassword = await bcrypt.compare(
      validatedData.currentPassword,
      user.password as string
    )

    if (!isValidPassword) {
      return { success: false, message: "Current password is incorrect" }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    })

    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0].message }
    }
    console.error("Error changing password:", error)
    return { success: false, message: "Failed to change password" }
  }
}

// Get user profile
export async function getUserProfile() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user || !user.employeeId) {
    return null
  }

  const employee = await prisma.employee.findUnique({
    where: { id: user.employeeId },
    include: {
      department: true,
      position: true,
    },
  })

  if (!employee) {
    return null
  }

  return {
    employee,
    user,
  }
}
