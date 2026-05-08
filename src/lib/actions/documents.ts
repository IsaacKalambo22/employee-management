"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabase, STORAGE_BUCKET } from "@/lib/supabase"

const UploadDocumentSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  documentType: z.enum(["ID_CARD", "CV", "CERTIFICATE", "CONTRACT", "OTHER"]),
  file: z.any(),
})

export type UploadDocumentState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
  documentUrl?: string
}

export async function uploadDocument(
  prevState: UploadDocumentState,
  formData: FormData
): Promise<UploadDocumentState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    const validatedFields = UploadDocumentSchema.safeParse({
      employeeId: formData.get("employeeId"),
      documentType: formData.get("documentType"),
      file: formData.get("file"),
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Invalid fields",
      }
    }

    const { employeeId, documentType, file } = validatedFields.data

    if (!file || !(file instanceof File)) {
      return { message: "No file provided" }
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${employeeId}/${Date.now()}.${fileExt}`
    const filePath = `${STORAGE_BUCKET}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        upsert: false,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return { message: "Failed to upload file" }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    // Save document record to database
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        documentType,
        fileName: file.name,
        filePath: publicUrl,
      },
    })

    revalidatePath(`/dashboard/employees/${employeeId}`)

    return {
      success: true,
      message: "Document uploaded successfully",
      documentUrl: publicUrl,
    }
  } catch (error) {
    console.error("Document upload error:", error)
    return { message: "Failed to upload document" }
  }
}

export async function deleteDocument(documentId: string) {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, message: "Unauthorized" }

  try {
    const document = await prisma.employeeDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return { success: false, message: "Document not found" }
    }

    // Delete from Supabase Storage
    const fileName = document.filePath.split('/').pop()
    if (fileName) {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileName])

      if (deleteError) {
        console.error("Supabase delete error:", deleteError)
      }
    }

    // Delete from database
    await prisma.employeeDocument.delete({
      where: { id: documentId },
    })

    revalidatePath(`/dashboard/employees/${document.employeeId}`)

    return { success: true, message: "Document deleted successfully" }
  } catch (error) {
    console.error("Document delete error:", error)
    return { success: false, message: "Failed to delete document" }
  }
}

export async function getEmployeeDocuments(employeeId: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { uploadedAt: "desc" },
  })
}
