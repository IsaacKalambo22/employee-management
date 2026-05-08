import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, Hash } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getEmployee } from "@/lib/actions/employees"
import { DocumentUploadForm } from "@/components/documents/document-upload-form"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  TERMINATED: "destructive",
  ON_LEAVE: "outline",
}

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const employee = await getEmployee(id)

  if (!employee) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Employees
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
              {employee.firstName[0]}{employee.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-gray-600 text-sm">{employee.position?.title ?? "No position assigned"}</p>
            <Badge variant={statusVariant[employee.status] ?? "secondary"} className="mt-1">
              {employee.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
        <Link href={`/dashboard/employees/${employee.id}/edit`} className={cn(buttonVariants({ size: "sm" }), "inline-flex items-center")}>
          Edit Employee
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{employee.email ?? "No email on file"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{employee.phone ?? "No phone on file"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Employment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{employee.department?.name ?? "No department assigned"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{employee.position?.title ?? "No position assigned"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>Hired {new Date(employee.hireDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground font-mono text-xs">{employee.id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emergency Contacts</CardTitle>
            <CardDescription>{employee.emergencyContacts.length} contact{employee.emergencyContacts.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {employee.emergencyContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No emergency contacts on file</p>
            ) : (
              <div className="space-y-3">
                {employee.emergencyContacts.map((contact) => (
                  <div key={contact.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{contact.name}</p>
                      {contact.isPrimary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{contact.relationship}</p>
                    <p className="text-xs mt-1">{contact.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
            <CardDescription>{employee.documents.length} document{employee.documents.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploadForm employeeId={employee.id} existingDocuments={employee.documents} />
          </CardContent>
        </Card>

        {/* System Account */}
        {employee.user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Login Email</span>
                <span>{employee.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="outline">{employee.user.role.replace("_", " ")}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
