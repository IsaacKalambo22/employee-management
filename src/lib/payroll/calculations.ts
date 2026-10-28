// Payroll calculation rules. Pure functions only - no database access - so the
// rules can be unit tested and reviewed by Finance in one place.
//
// Rates below follow the Malawi PAYE monthly bands and the Pension Act employee
// contribution. Confirm them with Finance before each tax year and update here.

export type TaxBand = { upTo: number | null; rate: number }

// Monthly PAYE bands (MWK). Each band applies to the slice of income within it.
export const PAYE_BANDS: TaxBand[] = [
  { upTo: 150_000, rate: 0 },
  { upTo: 500_000, rate: 0.25 },
  { upTo: 2_550_000, rate: 0.3 },
  { upTo: null, rate: 0.35 },
]

// Employee pension contribution, charged on basic salary
export const PENSION_EMPLOYEE_RATE = 0.05

// Staff loan limits
export const LOAN_MAX_SALARY_MULTIPLE = 3 // max principal = 3x monthly gross
export const LOAN_MAX_INSTALLMENT_RATIO = 1 / 3 // installment <= 1/3 of monthly gross
export const LOAN_MAX_TERM_MONTHS = 24

export type PayslipLine = {
  type: "EARNING" | "DEDUCTION"
  code: string
  label: string
  amount: number
}

export type PayslipCalculation = {
  grossPay: number
  tax: number
  otherDeductions: number
  netPay: number
  items: PayslipLine[]
}

export type SalaryInput = {
  baseSalary: number
  allowance: number
  bonus: number
  standingDeduction: number
}

export type DeductionInput = {
  type: string
  amount: number
  description?: string | null
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculatePAYE(taxableIncome: number, bands: TaxBand[] = PAYE_BANDS): number {
  let tax = 0
  let lowerBound = 0

  for (const band of bands) {
    if (taxableIncome <= lowerBound) break
    const upperBound = band.upTo ?? Infinity
    const slice = Math.min(taxableIncome, upperBound) - lowerBound
    tax += slice * band.rate
    lowerBound = upperBound
  }

  return roundMoney(tax)
}

export function calculatePension(baseSalary: number): number {
  return roundMoney(baseSalary * PENSION_EMPLOYEE_RATE)
}

const DEDUCTION_LABELS: Record<string, string> = {
  LOAN: "Staff Loan Repayment",
  INSURANCE: "Medical Insurance",
  ADVANCE: "Salary Advance Recovery",
  UNION: "Union Dues",
}

export function calculatePayslip(salary: SalaryInput, deductions: DeductionInput[]): PayslipCalculation {
  const earnings: PayslipLine[] = [
    { type: "EARNING", code: "BASIC", label: "Basic Salary", amount: salary.baseSalary },
    { type: "EARNING", code: "ALLOWANCE", label: "Allowances", amount: salary.allowance },
    { type: "EARNING", code: "BONUS", label: "Bonus", amount: salary.bonus },
  ].filter((line) => line.amount > 0) as PayslipLine[]

  const grossPay = roundMoney(earnings.reduce((sum, line) => sum + line.amount, 0))
  const tax = calculatePAYE(grossPay)
  const pension = calculatePension(salary.baseSalary)

  const deductionLines: PayslipLine[] = [
    { type: "DEDUCTION", code: "PAYE", label: "PAYE Tax", amount: tax },
    { type: "DEDUCTION", code: "PENSION", label: "Pension (Employee 5%)", amount: pension },
    ...deductions.map((d) => ({
      type: "DEDUCTION" as const,
      code: d.type.toUpperCase(),
      label: d.description || DEDUCTION_LABELS[d.type.toUpperCase()] || d.type,
      amount: roundMoney(d.amount),
    })),
  ]

  if (salary.standingDeduction > 0) {
    deductionLines.push({
      type: "DEDUCTION",
      code: "OTHER",
      label: "Other Deductions",
      amount: roundMoney(salary.standingDeduction),
    })
  }

  const items = [...earnings, ...deductionLines.filter((line) => line.amount > 0)]
  const totalDeductions = deductionLines.reduce((sum, line) => sum + line.amount, 0)
  const otherDeductions = roundMoney(totalDeductions - tax)

  return {
    grossPay,
    tax,
    otherDeductions,
    netPay: roundMoney(grossPay - totalDeductions),
    items,
  }
}

// Equal monthly installments, interest-free staff loan
export function calculateLoanInstallment(amount: number, termMonths: number): number {
  if (termMonths <= 0) return 0
  return Math.ceil((amount / termMonths) * 100) / 100
}

export function validateLoanRequest(
  amount: number,
  termMonths: number,
  monthlyGross: number
): string | null {
  if (monthlyGross <= 0) return "A salary record is required before applying for a loan"
  if (termMonths < 1 || termMonths > LOAN_MAX_TERM_MONTHS) {
    return `Repayment term must be between 1 and ${LOAN_MAX_TERM_MONTHS} months`
  }

  const maxPrincipal = monthlyGross * LOAN_MAX_SALARY_MULTIPLE
  if (amount > maxPrincipal) {
    return `Loan amount cannot exceed ${LOAN_MAX_SALARY_MULTIPLE}x your monthly gross pay (MWK ${maxPrincipal.toLocaleString()})`
  }

  const installment = calculateLoanInstallment(amount, termMonths)
  const maxInstallment = roundMoney(monthlyGross * LOAN_MAX_INSTALLMENT_RATIO)
  if (installment > maxInstallment) {
    return `Monthly installment (MWK ${installment.toLocaleString()}) cannot exceed one third of your gross pay (MWK ${maxInstallment.toLocaleString()}). Choose a longer term or smaller amount.`
  }

  return null
}

// "2026-10" -> first and last day of that month (local time)
export function periodBounds(period: string): { startDate: Date; endDate: Date } {
  const [year, month] = period.split("-").map(Number)
  return {
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 0, 23, 59, 59, 999),
  }
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number)
  if (!year || !month) return period
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

export function formatMWK(value: number | string | { toString(): string } | null | undefined): string {
  const n = Number(value ?? 0)
  return `MWK ${(isNaN(n) ? 0 : n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
