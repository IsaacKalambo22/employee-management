import { exportRequisitionsToPDF } from "@/lib/actions/exports"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  // Requisition exports cover all employees - restrict to roles that can read requisitions
  const session = await getServerSession(authOptions)
  if (!checkPermission(session?.user?.role, "READ_REQUISITIONS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    
    const pdfBuffer = await exportRequisitionsToPDF(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="requisitions-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error exporting requisitions to PDF:", error)
    return NextResponse.json({ error: "Failed to export PDF" }, { status: 500 })
  }
}
