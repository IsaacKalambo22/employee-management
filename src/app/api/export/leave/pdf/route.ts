import { exportLeaveRequestsToPDF } from "@/lib/actions/exports"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  // Leave exports cover all employees - restrict to roles that can read leave requests
  const session = await getServerSession(authOptions)
  if (!checkPermission(session?.user?.role, "READ_LEAVE_REQUESTS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    
    const pdfBuffer = await exportLeaveRequestsToPDF(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="leave-requests-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error exporting leave requests to PDF:", error)
    return NextResponse.json({ error: "Failed to export PDF" }, { status: 500 })
  }
}
