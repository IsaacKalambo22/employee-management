"use server"

import { prisma } from "@/lib/db"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

// Export employees to PDF
export async function exportEmployeesToPDF() {
  const employees = await prisma.employee.findMany({
    include: {
      department: true,
      position: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text("Employee Report", 14, 22)
  
  // Date
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
  
  // Table data
  const tableData = employees.map((emp) => [
    `${emp.firstName} ${emp.lastName}`,
    emp.email || "N/A",
    emp.phone || "N/A",
    emp.department?.name || "N/A",
    emp.position?.title || "N/A",
    emp.status,
    emp.hireDate.toLocaleDateString(),
  ])
  
  // Table headers
  const headers = [["Name", "Email", "Phone", "Department", "Position", "Status", "Hire Date"]]
  
  // Add table
  autoTable(doc, {
    head: headers,
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
  })
  
  // Save
  const pdfBytes = doc.output("arraybuffer")
  return Buffer.from(pdfBytes)
}

// Export leave requests to PDF
export async function exportLeaveRequestsToPDF(startDate?: Date, endDate?: Date) {
  const where: any = {}
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    }
  }
  
  const leaveRequests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: true,
      policy: true,
    },
    orderBy: { createdAt: "desc" },
  })
  
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text("Leave Requests Report", 14, 22)
  
  // Date
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
  
  // Table data
  const tableData = leaveRequests.map((req) => [
    `${req.employee.firstName} ${req.employee.lastName}`,
    req.policy.name,
    req.startDate.toLocaleDateString(),
    req.endDate.toLocaleDateString(),
    req.days.toString(),
    req.status,
    req.createdAt.toLocaleDateString(),
  ])
  
  // Table headers
  const headers = [["Employee", "Leave Type", "Start Date", "End Date", "Days", "Status", "Requested On"]]
  
  // Add table
  autoTable(doc, {
    head: headers,
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
  })
  
  // Save
  const pdfBytes = doc.output("arraybuffer")
  return Buffer.from(pdfBytes)
}

// Export attendance to PDF
export async function exportAttendanceToPDF(startDate?: Date, endDate?: Date) {
  const where: any = {}
  
  if (startDate && endDate) {
    where.date = {
      gte: startDate,
      lte: endDate,
    }
  }
  
  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      employee: true,
    },
    orderBy: { date: "desc" },
  })
  
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text("Attendance Report", 14, 22)
  
  // Date
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
  
  // Table data
  const tableData = attendance.map((att) => [
    `${att.employee.firstName} ${att.employee.lastName}`,
    att.date.toLocaleDateString(),
    att.clockIn?.toLocaleTimeString() || "N/A",
    att.clockOut?.toLocaleTimeString() || "N/A",
    att.status,
  ])
  
  // Table headers
  const headers = [["Employee", "Date", "Clock In", "Clock Out", "Status"]]
  
  // Add table
  autoTable(doc, {
    head: headers,
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
  })
  
  // Save
  const pdfBytes = doc.output("arraybuffer")
  return Buffer.from(pdfBytes)
}

// Export payroll to PDF
export async function exportPayrollToPDF(period?: string) {
  const where: any = {}
  
  if (period) {
    where.period = period
  }
  
  const payroll = await prisma.payroll.findMany({
    where,
    include: {
      payslips: {
        include: {
          employee: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text("Payroll Report", 14, 22)
  
  // Date
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
  
  // Flatten payslips
  const tableData = payroll.flatMap((pay) =>
    pay.payslips.map((payslip) => [
      payslip.employee.firstName,
      payslip.employee.lastName,
      pay.period,
      `MWK ${Number(payslip.grossPay).toLocaleString()}`,
      `MWK ${Number(payslip.netPay).toLocaleString()}`,
      payslip.employee.positionId || "N/A",
    ])
  )
  
  // Table headers
  const headers = [["First Name", "Last Name", "Period", "Gross Pay", "Net Pay", "Position"]]
  
  // Add table
  autoTable(doc, {
    head: headers,
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
  })
  
  // Save
  const pdfBytes = doc.output("arraybuffer")
  return Buffer.from(pdfBytes)
}

// Export requisitions to PDF
export async function exportRequisitionsToPDF(startDate?: Date, endDate?: Date) {
  const where: any = {}
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    }
  }
  
  const requisitions = await prisma.requisition.findMany({
    where,
    include: {
      employee: true,
    },
    orderBy: { createdAt: "desc" },
  })
  
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text("Requisitions Report", 14, 22)
  
  // Date
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
  
  // Table data
  const tableData = requisitions.map((req) => [
    `${req.employee.firstName} ${req.employee.lastName}`,
    req.category,
    `MWK ${Number(req.amount).toLocaleString()}`,
    req.status,
    req.createdAt.toLocaleDateString(),
  ])
  
  // Table headers
  const headers = [["Employee", "Category", "Amount", "Status", "Requested On"]]
  
  // Add table
  autoTable(doc, {
    head: headers,
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
  })
  
  // Save
  const pdfBytes = doc.output("arraybuffer")
  return Buffer.from(pdfBytes)
}

// Excel Export Functions

// Export employees to Excel
export async function exportEmployeesToExcel() {
  const employees = await prisma.employee.findMany({
    include: {
      department: true,
      position: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const data = employees.map((emp) => ({
    Name: `${emp.firstName} ${emp.lastName}`,
    Email: emp.email || "N/A",
    Phone: emp.phone || "N/A",
    Department: emp.department?.name || "N/A",
    Position: emp.position?.title || "N/A",
    Status: emp.status,
    "Hire Date": emp.hireDate.toLocaleDateString(),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees")
  
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
  return Buffer.from(excelBuffer)
}

// Export leave requests to Excel
export async function exportLeaveRequestsToExcel(startDate?: Date, endDate?: Date) {
  const where: any = {}
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    }
  }
  
  const leaveRequests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: true,
      policy: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const data = leaveRequests.map((req) => ({
    Employee: `${req.employee.firstName} ${req.employee.lastName}`,
    "Leave Type": req.policy.name,
    "Start Date": req.startDate.toLocaleDateString(),
    "End Date": req.endDate.toLocaleDateString(),
    Days: req.days,
    Status: req.status,
    "Requested On": req.createdAt.toLocaleDateString(),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Requests")
  
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
  return Buffer.from(excelBuffer)
}

// Export attendance to Excel
export async function exportAttendanceToExcel(startDate?: Date, endDate?: Date) {
  const where: any = {}
  
  if (startDate && endDate) {
    where.date = {
      gte: startDate,
      lte: endDate,
    }
  }
  
  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      employee: true,
    },
    orderBy: { date: "desc" },
  })

  const data = attendance.map((att) => ({
    Employee: `${att.employee.firstName} ${att.employee.lastName}`,
    Date: att.date.toLocaleDateString(),
    "Clock In": att.clockIn?.toLocaleTimeString() || "N/A",
    "Clock Out": att.clockOut?.toLocaleTimeString() || "N/A",
    Status: att.status,
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance")
  
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
  return Buffer.from(excelBuffer)
}

// Export payroll to Excel
export async function exportPayrollToExcel(period?: string) {
  const where: any = {}
  
  if (period) {
    where.period = period
  }
  
  const payroll = await prisma.payroll.findMany({
    where,
    include: {
      payslips: {
        include: {
          employee: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const data = payroll.flatMap((pay) =>
    pay.payslips.map((payslip) => ({
      "First Name": payslip.employee.firstName,
      "Last Name": payslip.employee.lastName,
      Period: pay.period,
      "Gross Pay": Number(payslip.grossPay),
      "Net Pay": Number(payslip.netPay),
      Position: payslip.employee.positionId || "N/A",
    }))
  )

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll")
  
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
  return Buffer.from(excelBuffer)
}

// Export requisitions to Excel
export async function exportRequisitionsToExcel(startDate?: Date, endDate?: Date) {
  const where: any = {}
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    }
  }
  
  const requisitions = await prisma.requisition.findMany({
    where,
    include: {
      employee: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const data = requisitions.map((req) => ({
    Employee: `${req.employee.firstName} ${req.employee.lastName}`,
    Category: req.category,
    Amount: Number(req.amount),
    Status: req.status,
    "Requested On": req.createdAt.toLocaleDateString(),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Requisitions")
  
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
  return Buffer.from(excelBuffer)
}
