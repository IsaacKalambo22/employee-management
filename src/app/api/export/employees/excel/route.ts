import { exportEmployeesToExcel } from "@/lib/actions/exports"
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
    const excelBuffer = await exportEmployeesToExcel()
    
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="employees-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error exporting employees to Excel:", error)
    return NextResponse.json({ error: "Failed to export Excel" }, { status: 500 })
  }
}
