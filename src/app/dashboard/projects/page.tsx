import Link from "next/link"
import { Plus, Briefcase } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getProjects } from "@/lib/actions/projects"
import { formatMWK } from "@/lib/payroll/calculations"
import { utilizationRate } from "@/lib/finance/project-budget"
import { StatusBadge, UtilizationBar, utilizationColor } from "@/components/finance/status-badge"

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const fiscalYear = Number(params.year) || currentYear
  const projects = await getProjects({ fiscalYear })

  const funded = projects.filter((p) => p.status === "APPROVED" || p.status === "COMPLETED")
  const approved = funded.reduce((sum, p) => sum + Number(p.approvedBudget ?? 0), 0)
  const spent = funded.reduce((sum, p) => sum + Number(p.spentAmount), 0)
  const pending = projects.filter((p) => p.status === "PENDING_REVIEW")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Department Projects</h1>
          <p className="text-gray-600 text-sm mt-1">Approved project budgets form each department&apos;s annual budget</p>
        </div>
        <div className="flex items-center gap-2">
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <Link
              key={y}
              href={`/dashboard/projects?year=${y}`}
              className={cn(buttonVariants({ variant: y === fiscalYear ? "secondary" : "ghost", size: "sm" }))}
            >
              FY {y}
            </Link>
          ))}
          <Link href="/dashboard/projects/new" className={cn(buttonVariants({ size: "sm" }), "inline-flex items-center")}>
            <Plus className="mr-2 h-4 w-4" />
            Propose Project
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Approved Budget (FY {fiscalYear})</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatMWK(approved)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Spent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={cn("text-2xl font-bold", utilizationColor(utilizationRate(spent, approved)).text)}>{formatMWK(spent)}</p>
            <p className="text-xs text-muted-foreground mt-1">{utilizationRate(spent, approved).toFixed(1)}% utilised</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Awaiting Finance Review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatMWK(pending.reduce((sum, p) => sum + Number(p.proposedBudget), 0))} proposed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>FY {fiscalYear}</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Briefcase className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No projects for FY {fiscalYear}</p>
              <p className="text-xs mt-1">Propose a project to request a departmental budget</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Proposed</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="w-40 hidden lg:table-cell">Utilisation</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const budget = Number(project.approvedBudget ?? 0)
                  const rate = utilizationRate(Number(project.spentAmount), budget)
                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.proposedBy ? `Proposed by ${project.proposedBy.firstName} ${project.proposedBy.lastName}` : "—"}
                          {project._count.requisitions > 0 && ` · ${project._count.requisitions} requisition(s)`}
                        </p>
                        {project.reviewComment && (
                          <p className="text-xs text-gray-500 mt-1 italic">Finance: {project.reviewComment}</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{project.department.name}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">{formatMWK(project.proposedBudget)}</TableCell>
                      <TableCell className="text-right">{project.approvedBudget ? formatMWK(project.approvedBudget) : "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {budget > 0 ? (
                          <div className="space-y-1">
                            <UtilizationBar rate={rate} />
                            <p className="text-xs text-muted-foreground">{formatMWK(project.spentAmount)} · {rate.toFixed(0)}%</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={project.status} /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
