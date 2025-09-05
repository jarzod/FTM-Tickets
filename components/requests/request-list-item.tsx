"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { TicketRequest } from "@/lib/requests"
import { Clock, Star, HandHeart, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface RequestListItemProps {
  request: TicketRequest
  eventName?: string
  showEventName?: boolean
}

export function RequestListItem({ request, eventName, showEventName = false }: RequestListItemProps) {
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case "want":
        return { label: "Want", color: "bg-yellow-100 text-yellow-800", icon: Clock }
      case "need":
        return { label: "Need", color: "bg-orange-100 text-orange-800", icon: Star }
      case "nice-to-have":
        return { label: "Nice to Have", color: "bg-blue-100 text-blue-800", icon: HandHeart }
      default:
        return { label: "", color: "", icon: Clock }
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pending", color: "bg-gray-100 text-gray-800", icon: AlertCircle }
      case "approved":
        return { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle }
      case "denied":
        return { label: "Denied", color: "bg-red-100 text-red-800", icon: XCircle }
      default:
        return { label: "", color: "", icon: AlertCircle }
    }
  }

  const priorityInfo = getPriorityInfo(request.priority)
  const statusInfo = getStatusInfo(request.status)
  const PriorityIcon = priorityInfo.icon
  const StatusIcon = statusInfo.icon

  return (
    <Card className={`${request.status === "denied" ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className={`${request.status === "denied" ? "line-through" : ""}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {showEventName && eventName && <h4 className="font-medium mb-1">{eventName}</h4>}
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium">{request.userName}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{request.userCompany}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Requested {format(new Date(request.requestedAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
              {request.processedAt && (
                <div className="text-sm text-muted-foreground">
                  {request.status === "approved" ? "Approved" : "Denied"}{" "}
                  {format(new Date(request.processedAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={priorityInfo.color}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {priorityInfo.label}
              </Badge>
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {request.message && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <strong>Message:</strong> {request.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
