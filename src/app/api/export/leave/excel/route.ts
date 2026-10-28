import { exportLeaveRequestsToExcel } from "@/lib/actions/exports"
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
    
    const excelBuffer = await exportLeaveRequestsToExcel(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )
    
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="leave-requests-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error exporting leave requests to Excel:", error)
    return NextResponse.json({ error: "Failed to export Excel" }, { status: 500 })
  }
}
