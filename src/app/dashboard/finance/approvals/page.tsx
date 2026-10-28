import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { checkPermission } from "@/lib/permissions"
import { getPendingFinanceApprovals } from "@/lib/actions/finance"
import { formatMWK, formatPeriod } from "@/lib/payroll/calculations"
import { LoanReviewActions, PayrollReleaseButton, ProjectReviewActions } from "@/components/finance/review-actions"
import { RequisitionApprovalActions } from "@/components/requisitions/requisition-approval-actions"
import { StatusBadge } from "@/components/finance/status-badge"

const date = (d: Date | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "—")

function Section({
  title,
  description,
  count,
  children,
}: {
  title: string
  description: string
  count: number
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">{count}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {count === 0 ? <p className="text-sm text-muted-foreground py-4">Nothing awaiting review.</p> : children}
      </CardContent>
    </Card>
  )
}

export default async function PendingApprovalsPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const pending = await getPendingFinanceApprovals()
  const canReviewProjects = checkPermission(role, "REVIEW_PROJECT")
  const canReviewLoans = checkPermission(role, "REVIEW_LOAN")
  const canApproveRequisitions = checkPermission(role, "APPROVE_REQUISITION")
  const canReleasePayroll = checkPermission(role, "APPROVE_PAYROLL")

  if (pending.total === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mb-3 text-green-500" />
          <p className="text-sm font-medium text-gray-900">All caught up</p>
          <p className="text-xs mt-1">There are no budgets or transactions awaiting Finance review</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Section
        title="Project Budgets"
        description="Department project proposals awaiting budget approval"
        count={pending.projects.length}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden sm:table-cell">FY</TableHead>
              <TableHead className="text-right">Proposed</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="max-w-sm">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {project.proposedBy ? `${project.proposedBy.firstName} ${project.proposedBy.lastName}` : "—"} · {date(project.createdAt)}
                  </p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{project.department.name}</TableCell>
                <TableCell className="hidden sm:table-cell">{project.fiscalYear}</TableCell>
                <TableCell className="text-right font-semibold">{formatMWK(project.proposedBudget)}</TableCell>
                <TableCell className="text-right">
                  {canReviewProjects && project.proposedById !== session?.user?.employeeId && (
                    <ProjectReviewActions projectId={project.id} proposedBudget={Number(project.proposedBudget)} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section
        title="Staff Loans"
        description="Loan applications awaiting approval"
        count={pending.loans.length}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Term</TableHead>
              <TableHead className="text-right hidden md:table-cell">Installment</TableHead>
              <TableHead className="text-right hidden lg:table-cell">% of Gross</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.loans.map((loan) => {
              const salary = loan.employee.salary
              const gross = salary ? Number(salary.baseSalary) + Number(salary.allowance) + Number(salary.bonus) : 0
              return (
                <TableRow key={loan.id}>
                  <TableCell className="max-w-xs">
                    <p className="font-medium">{loan.employee.firstName} {loan.employee.lastName}</p>
                    <p className="text-xs text-muted-foreground">{loan.employee.department?.name ?? "—"} · {date(loan.createdAt)}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{loan.purpose}</p>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatMWK(loan.amount)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{loan.termMonths} months</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{formatMWK(loan.monthlyInstallment)}</TableCell>
                  <TableCell className="text-right hidden lg:table-cell">
                    {gross > 0 ? `${((Number(loan.monthlyInstallment) / gross) * 100).toFixed(1)}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canReviewLoans && loan.employeeId !== session?.user?.employeeId && <LoanReviewActions loanId={loan.id} />}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Section>

      <Section
        title="Requisitions"
        description="Manager-approved spend awaiting Finance approval"
        count={pending.requisitions.length}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requisition</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.requisitions.map((req) => {
              const remaining = req.project
                ? Number(req.project.approvedBudget ?? 0) - Number(req.project.spentAmount)
                : null
              return (
                <TableRow key={req.id}>
                  <TableCell className="max-w-xs">
                    <p className="font-medium">{req.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.employee.firstName} {req.employee.lastName} · {req.employee.department?.name ?? "—"} · {req.category}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {req.project ? (
                      <>
                        <p>{req.project.name}</p>
                        <p className="text-xs text-muted-foreground">{formatMWK(remaining)} available</p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{req.amount ? formatMWK(req.amount) : "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell"><StatusBadge status={req.status} /></TableCell>
                  <TableCell className="text-right">
                    {canApproveRequisitions && (
                      <RequisitionApprovalActions requisitionId={req.id} status={req.status} currentLevel={2} />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Section>

      <Section
        title="Payroll Release"
        description="Processed payrolls awaiting payment confirmation"
        count={pending.payrolls.length}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="hidden sm:table-cell">Employees</TableHead>
              <TableHead className="text-right hidden md:table-cell">Gross</TableHead>
              <TableHead className="text-right">Net Payable</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.payrolls.map((payroll) => (
              <TableRow key={payroll.id}>
                <TableCell>
                  <p className="font-medium">{formatPeriod(payroll.period)}</p>
                  <p className="text-xs text-muted-foreground">Processed {date(payroll.processedAt)}</p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{payroll.employeeCount}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{formatMWK(payroll.totalGross)}</TableCell>
                <TableCell className="text-right font-semibold">{formatMWK(payroll.totalNet)}</TableCell>
                <TableCell className="text-right">
                  {canReleasePayroll && payroll.processedBy !== session?.user?.id && (
                    <PayrollReleaseButton payrollId={payroll.id} period={formatPeriod(payroll.period)} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </div>
  )
}
