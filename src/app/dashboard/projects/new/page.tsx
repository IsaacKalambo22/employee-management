import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getProposableDepartments } from "@/lib/actions/projects"
import { ProjectForm } from "@/components/projects/project-form"

export default async function NewProjectPage() {
  const departments = await getProposableDepartments()

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/projects" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Projects
      </Link>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Propose a Project</h1>
        <p className="text-gray-600 text-sm mt-1">
          Once approved by Finance, the project budget is added to your department&apos;s budget for the year
        </p>
      </div>
      {departments.length === 0 ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          You are not assigned to a department. Contact HR to propose projects.
        </div>
      ) : (
        <ProjectForm departments={departments} />
      )}
    </div>
  )
}
