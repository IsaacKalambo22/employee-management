import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getDepartmentBudgets } from "@/lib/actions/finance"
import { formatMWK } from "@/lib/payroll/calculations"
import { UtilizationBar, utilizationColor } from "@/components/finance/status-badge"

export default async function BudgetUtilizationPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const fiscalYear = Number(params.year) || currentYear
  const { departments, totals } = await getDepartmentBudgets(fiscalYear)

  const funded = departments
    .filter((d) => d.approved > 0)
    .sort((a, b) => b.utilizationRate - a.utilizationRate)
  const unfunded = departments.filter((d) => d.approved === 0)
  const alerts = funded.filter((d) => d.utilizationRate > 75)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600">
            Overall: <span className={cn("font-semibold", utilizationColor(totals.utilizationRate).text)}>{totals.utilizationRate.toFixed(1)}%</span>
            {" "}of {formatMWK(totals.approved)} spent
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <Link
              key={y}
              href={`/dashboard/finance/utilization?year=${y}`}
              className={cn(buttonVariants({ variant: y === fiscalYear ? "secondary" : "ghost", size: "sm" }))}
            >
              FY {y}
            </Link>
          ))}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((d) => (
            <div
              key={d.departmentId}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
                d.utilizationRate > 90 ? "bg-red-50 border-red-200 text-red-800" : "bg-yellow-50 border-yellow-200 text-yellow-800"
              )}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <strong>{d.department}</strong> has used {d.utilizationRate.toFixed(1)}% of its budget
                ({formatMWK(d.remaining)} remaining)
              </span>
            </div>
          ))}
        </div>
      )}

      {funded.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No approved project budgets for FY {fiscalYear}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {funded.map((dept) => {
            const color = utilizationColor(dept.utilizationRate)
            return (
              <Card key={dept.departmentId}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">{dept.department}</CardTitle>
                      <CardDescription>
                        {formatMWK(dept.spent)} of {formatMWK(dept.approved)}
                      </CardDescription>
                    </div>
                    <span className={cn("text-2xl font-bold", color.text)}>{dept.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <UtilizationBar rate={dept.utilizationRate} />
                </CardHeader>
                <CardContent className="space-y-3">
                  {dept.projects
                    .filter((p) => p.status !== "PENDING_REVIEW")
                    .map((project) => (
                      <div key={project.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{project.name}</span>
                          <span className={cn("font-medium", utilizationColor(project.utilizationRate).text)}>
                            {project.utilizationRate.toFixed(0)}%
                          </span>
                        </div>
                        <UtilizationBar rate={project.utilizationRate} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Spent {formatMWK(project.spent)}</span>
                          <span>Budget {formatMWK(project.approved)}</span>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {unfunded.length > 0 && (
        <p className="text-xs text-muted-foreground">
          No approved budget for FY {fiscalYear}: {unfunded.map((d) => d.department).join(", ")}
        </p>
      )}
    </div>
  )
}
