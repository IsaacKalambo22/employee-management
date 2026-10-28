import { NextRequest, NextResponse } from "next/server"
import { getPayslipDetail } from "@/lib/actions/payroll"
import { buildPayslipPdf } from "@/lib/payroll/payslip-pdf"

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/payslips/[id]/pdf">) {
  try {
    const { id } = await ctx.params
    // getPayslipDetail returns null unless the user owns the payslip or has payroll access
    const payslip = await getPayslipDetail(id)
    if (!payslip) {
      return NextResponse.json({ error: "Payslip not found" }, { status: 404 })
    }

    const pdfBuffer = buildPayslipPdf(payslip)
    const name = `${payslip.employee.lastName}-${payslip.payroll.period}`.toLowerCase().replace(/[^a-z0-9-]/g, "")

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payslip-${name}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error generating payslip PDF:", error)
    return NextResponse.json({ error: "Failed to generate payslip" }, { status: 500 })
  }
}
