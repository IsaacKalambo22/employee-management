import { exportEmployeesToPDF } from "@/lib/actions/exports"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions"

export async function GET() {
  // Employee exports contain personal data - restrict to roles that can read employees
  const session = await getServerSession(authOptions)
  if (!checkPermission(session?.user?.role, "READ_EMPLOYEES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const pdfBuffer = await exportEmployeesToPDF()
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="employees-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error exporting employees to PDF:", error)
    return NextResponse.json({ error: "Failed to export PDF" }, { status: 500 })
  }
}
