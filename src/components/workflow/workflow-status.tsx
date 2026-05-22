import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react"

interface WorkflowStep {
  id: string
  name: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "FAILED"
  approver?: string
  completedAt?: Date
}

interface WorkflowStatusProps {
  steps: WorkflowStep[]
  currentStatus: string
}

export function WorkflowStatus({ steps, currentStatus }: WorkflowStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "PENDING":
        return <Clock className="h-5 w-5 text-gray-400" />
      case "SKIPPED":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200"
      case "PENDING":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "SKIPPED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Workflow Progress</span>
          <Badge className={getStatusColor(currentStatus)}>{currentStatus}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                  {getStatusIcon(step.status)}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{step.name}</p>
                  <Badge variant="outline" className={getStatusColor(step.status)}>
                    {step.status}
                  </Badge>
                </div>
                {step.approver && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Approver: {step.approver}
                  </p>
                )}
                {step.completedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed: {new Date(step.completedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
