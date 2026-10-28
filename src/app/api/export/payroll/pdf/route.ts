import { exportPayrollToPDF } from "@/lib/actions/exports"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  // Payroll exports contain every employee's pay - restrict to payroll staff
  const session = await getServerSession(authOptions)
  if (!checkPermission(session?.user?.role, "READ_PAYROLL")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period")
    
    const pdfBuffer = await exportPayrollToPDF(period || undefined)
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payroll-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error exporting payroll to PDF:", error)
    return NextResponse.json({ error: "Failed to export PDF" }, { status: 500 })
  }
}
