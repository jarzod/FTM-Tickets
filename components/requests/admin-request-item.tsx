"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useRequests } from "@/hooks/use-requests"
import { useEvents } from "@/hooks/use-events"
import type { TicketRequest } from "@/lib/requests"
import type { Event } from "@/lib/events"
import { Clock, Star, HandHeart, Check, X, Trash2 } from "lucide-react"
import { format } from "date-fns"

interface AdminRequestItemProps {
  request: TicketRequest
  event: Event
}

export function AdminRequestItem({ request, event }: AdminRequestItemProps) {
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)

  const { user } = useAuth()
  const { updateRequestStatus, deleteRequest } = useRequests()
  const { updateTicketAssignment } = useEvents()

  const availableTickets = event.tickets.filter((ticket) => !ticket.assignedTo)

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

  const handleComplete = async () => {
    if (!user) return

    setProcessing(true)
    try {
      updateRequestStatus(request.id, "completed", user.name)
    } catch (error) {
      console.error("Error completing request:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!user) return

    setProcessing(true)
    try {
      updateRequestStatus(request.id, "denied", user.name)
    } catch (error) {
      console.error("Error rejecting request:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    setProcessing(true)
    try {
      deleteRequest(request.id)
    } catch (error) {
      console.error("Error deleting request:", error)
    } finally {
      setProcessing(false)
    }
  }

  if (request.status !== "pending") {
    const priorityInfo = getPriorityInfo(request.priority)
    const PriorityIcon = priorityInfo.icon

    return (
      <div
        className={`p-3 border rounded-lg ${
          request.status === "denied"
            ? "opacity-60 line-through"
            : request.status === "completed"
              ? "bg-green-50 border-green-200"
              : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium">{request.userName}</span>
              <span className="text-sm text-muted-foreground">({request.userCompany})</span>
              <Badge className={priorityInfo.color}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {priorityInfo.label}
              </Badge>
            </div>
            {request.requestedQuantities && request.requestedQuantities.length > 0 && (
              <div className="text-sm text-muted-foreground mb-1">
                Willing to take: {request.requestedQuantities.join(", ")} ticket
                {request.requestedQuantities.length > 1 ? "s" : ""}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {request.status === "completed" ? "Completed" : request.status === "approved" ? "Approved" : "Rejected"}{" "}
              {request.processedAt && format(new Date(request.processedAt), "MMM d, yyyy")}
            </div>
            {request.message && <div className="text-sm text-muted-foreground mt-1">"{request.message}"</div>}
          </div>
          <Badge
            className={
              request.status === "completed"
                ? "bg-green-100 text-green-800"
                : request.status === "approved"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
            }
          >
            {request.status === "completed" ? "Completed" : request.status === "approved" ? "Approved" : "Rejected"}
          </Badge>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={processing}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    )
  }

  const priorityInfo = getPriorityInfo(request.priority)
  const PriorityIcon = priorityInfo.icon

  return (
    <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium">{request.userName}</span>
            <span className="text-sm text-muted-foreground">({request.userCompany})</span>
            <Badge className={priorityInfo.color}>
              <PriorityIcon className="h-3 w-3 mr-1" />
              {priorityInfo.label}
            </Badge>
          </div>
          {request.requestedQuantities && request.requestedQuantities.length > 0 && (
            <div className="text-sm font-medium text-blue-700 mb-2">
              Willing to take: {request.requestedQuantities.join(", ")} ticket
              {request.requestedQuantities.length > 1 ? "s" : ""}
            </div>
          )}
          <div className="text-sm text-muted-foreground mb-2">
            Requested {format(new Date(request.requestedAt), "MMM d, yyyy 'at' h:mm a")}
          </div>
          {request.message && (
            <div className="text-sm text-muted-foreground bg-white p-2 rounded border">
              <strong>Message:</strong> {request.message}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground bg-blue-50 px-2 py-1 rounded">
          <strong>Instructions:</strong> Manually assign tickets above, then mark this request as completed or rejected.
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={handleComplete} disabled={processing}>
            <Check className="h-4 w-4 mr-1" />
            Mark Complete
          </Button>

          <Button size="sm" variant="destructive" onClick={handleReject} disabled={processing}>
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>

          <Button size="sm" variant="outline" onClick={handleDelete} disabled={processing}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
