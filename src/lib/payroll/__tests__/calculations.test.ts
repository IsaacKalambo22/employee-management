import { describe, it, expect } from "vitest"
import {
  calculateLoanInstallment,
  calculatePAYE,
  calculatePayslip,
  periodBounds,
  validateLoanRequest,
} from "../calculations"

describe("calculatePAYE", () => {
  it("charges no tax up to the tax-free band", () => {
    expect(calculatePAYE(0)).toBe(0)
    expect(calculatePAYE(150_000)).toBe(0)
  })

  it("taxes only the slice of income within each band", () => {
    // 350,000 @ 25%
    expect(calculatePAYE(500_000)).toBe(87_500)
    // 87,500 + 500,000 @ 30%
    expect(calculatePAYE(1_000_000)).toBe(237_500)
    // 87,500 + 2,050,000 @ 30% + 450,000 @ 35%
    expect(calculatePAYE(3_000_000)).toBe(87_500 + 615_000 + 157_500)
  })
})

describe("calculatePayslip", () => {
  it("itemises earnings, PAYE, pension and other deductions", () => {
    const result = calculatePayslip(
      { baseSalary: 800_000, allowance: 200_000, bonus: 0, standingDeduction: 10_000 },
      [{ type: "LOAN", amount: 50_000, description: "Staff Loan Repayment (12 months)" }]
    )

    expect(result.grossPay).toBe(1_000_000)
    expect(result.tax).toBe(237_500)
    // pension 5% of basic (40,000) + loan 50,000 + standing 10,000
    expect(result.otherDeductions).toBe(100_000)
    expect(result.netPay).toBe(1_000_000 - 237_500 - 100_000)

    expect(result.items.map((i) => i.code)).toEqual(["BASIC", "ALLOWANCE", "PAYE", "PENSION", "LOAN", "OTHER"])
    expect(result.items.find((i) => i.code === "BONUS")).toBeUndefined()
  })

  it("uses exactly the salary entered by HR (reported case: basic 386,181 + allowance 60,000)", () => {
    const result = calculatePayslip(
      { baseSalary: 386_181, allowance: 60_000, bonus: 0, standingDeduction: 84_163.35 },
      []
    )

    expect(result.grossPay).toBe(446_181)
    expect(result.tax).toBe(74_045.25) // 25% of the 296,181 above the tax-free band
    expect(result.items.find((i) => i.code === "PENSION")?.amount).toBe(19_309.05)
    expect(result.otherDeductions).toBe(103_472.4) // pension + other fixed deductions
    expect(result.netPay).toBe(268_663.35)
  })

  it("omits PAYE line when no tax is due", () => {
    const result = calculatePayslip({ baseSalary: 100_000, allowance: 0, bonus: 0, standingDeduction: 0 }, [])
    expect(result.tax).toBe(0)
    expect(result.items.some((i) => i.code === "PAYE")).toBe(false)
    expect(result.netPay).toBe(95_000)
  })
})

describe("loans", () => {
  it("rounds installments up to the cent so the principal is fully recovered", () => {
    expect(calculateLoanInstallment(100_000, 3)).toBe(33_333.34)
  })

  it("rejects loans without a salary, over 3x gross, or with installments above a third of gross", () => {
    expect(validateLoanRequest(100_000, 12, 0)).toMatch(/salary record/)
    expect(validateLoanRequest(3_100_000, 24, 1_000_000)).toMatch(/cannot exceed 3x/)
    expect(validateLoanRequest(1_000_000, 2, 1_000_000)).toMatch(/one third/)
    expect(validateLoanRequest(1_000_000, 12, 1_000_000)).toBeNull()
  })

  it("enforces the maximum term", () => {
    expect(validateLoanRequest(100_000, 36, 1_000_000)).toMatch(/between 1 and 24/)
  })
})

describe("periodBounds", () => {
  it("returns the first and last day of the month", () => {
    const { startDate, endDate } = periodBounds("2026-02")
    expect(startDate.getDate()).toBe(1)
    expect(startDate.getMonth()).toBe(1)
    expect(endDate.getDate()).toBe(28)
    expect(endDate.getMonth()).toBe(1)
  })
})
