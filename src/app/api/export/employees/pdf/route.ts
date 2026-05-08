import { exportEmployeesToPDF } from "@/lib/actions/exports"
import { NextResponse } from "next/server"

export async function GET() {
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
