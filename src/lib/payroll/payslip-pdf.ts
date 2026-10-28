import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatMWK, formatPeriod } from "@/lib/payroll/calculations"

type PayslipForPdf = {
  id: string
  grossPay: unknown
  tax: unknown
  otherDeductions: unknown
  netPay: unknown
  payDate: Date | null
  payroll: { period: string; status: string }
  employee: {
    firstName: string
    lastName: string
    grade: string | null
    department: { name: string } | null
    position: { title: string } | null
  }
  items: { type: string; label: string; amount: unknown }[]
}

export function buildPayslipPdf(payslip: PayslipForPdf): Buffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(18)
  doc.text("PAYSLIP", 14, 22)
  doc.setFontSize(11)
  doc.text(formatPeriod(payslip.payroll.period), pageWidth - 14, 22, { align: "right" })

  doc.setFontSize(10)
  const details: [string, string][] = [
    ["Employee", `${payslip.employee.firstName} ${payslip.employee.lastName}`],
    ["Position", payslip.employee.position?.title ?? "—"],
    ["Department", payslip.employee.department?.name ?? "—"],
    ["Grade", payslip.employee.grade ?? "—"],
    ["Payment Date", payslip.payDate ? new Date(payslip.payDate).toLocaleDateString("en-GB") : "Pending"],
    ["Reference", payslip.id.slice(0, 8).toUpperCase()],
  ]
  details.forEach(([label, value], i) => {
    const y = 34 + Math.floor(i / 2) * 6
    const x = i % 2 === 0 ? 14 : pageWidth / 2 + 4
    doc.setFont("helvetica", "bold")
    doc.text(`${label}:`, x, y)
    doc.setFont("helvetica", "normal")
    doc.text(value, x + 28, y)
  })

  const earnings = payslip.items.filter((i) => i.type === "EARNING")
  const deductions = payslip.items.filter((i) => i.type === "DEDUCTION")
  const rows = Math.max(earnings.length, deductions.length)
  const body = Array.from({ length: rows }, (_, i) => [
    earnings[i]?.label ?? "",
    earnings[i] ? formatMWK(earnings[i].amount as number) : "",
    deductions[i]?.label ?? "",
    deductions[i] ? formatMWK(deductions[i].amount as number) : "",
  ])
  const totalDeductions = Number(payslip.tax) + Number(payslip.otherDeductions)

  autoTable(doc, {
    head: [["Earnings", "Amount", "Deductions", "Amount"]],
    body,
    foot: [["Gross Pay", formatMWK(payslip.grossPay as number), "Total Deductions", formatMWK(totalDeductions)]],
    startY: 58,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [240, 248, 255], textColor: 20, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 3: { halign: "right" } },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text("NET PAY", 14, finalY)
  doc.text(formatMWK(payslip.netPay as number), pageWidth - 14, finalY, { align: "right" })

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("This is a system-generated payslip and does not require a signature.", 14, finalY + 12)

  return Buffer.from(doc.output("arraybuffer"))
}
