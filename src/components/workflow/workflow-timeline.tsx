import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle2, Clock, XCircle, MoreHorizontal } from "lucide-react"

interface ApprovalAction {
  id: string
  action: "APPROVED" | "REJECTED" | "PENDING" | "CANCELLED"
  approverName: string
  approverEmail?: string
  comments?: string
  createdAt: Date
  stepName: string
}

interface WorkflowTimelineProps {
  actions: ApprovalAction[]
  entityType: string
  entityId: string
}

export function WorkflowTimeline({ actions, entityType, entityId }: WorkflowTimelineProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <MoreHorizontal className="h-4 w-4 text-gray-400" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No approval actions recorded yet
            </p>
          ) : (
            actions.map((action, index) => (
              <div key={action.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(action.approverName)}
                    </AvatarFallback>
                  </Avatar>
                  {index < actions.length - 1 && (
                    <div className="w-0.5 h-16 bg-gray-200 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{action.approverName}</p>
                      <Badge variant="outline" className={getActionColor(action.action)}>
                        {action.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(action.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {action.stepName}
                  </p>
                  {action.comments && (
                    <p className="text-sm text-gray-600 italic">"{action.comments}"</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
