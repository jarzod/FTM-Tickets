"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useRequests } from "@/hooks/use-requests"
import { useEvents } from "@/hooks/use-events"
import { useWorkspace } from "@/hooks/use-workspace"
import { RequestListItem } from "./request-list-item"
import { Inbox } from "lucide-react"

export function UserRequestsView() {
  const { user } = useAuth()
  const { getRequestsByUserId } = useRequests()
  const { getEventById } = useEvents()
  const { workspace } = useWorkspace()

  if (!user) return null

  const userRequests = getRequestsByUserId(user.id)
  const pendingRequests = userRequests.filter((request) => request.status === "pending" || request.status === "denied")

  if (pendingRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Ticket Requests</h3>
          <p className="text-muted-foreground">
            You haven't requested any tickets yet. Browse events to make your first request.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Ticket Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingRequests.map((request) => {
            const event = getEventById(request.eventId)
            const team = workspace?.teams.find((t) => t.id === event?.teamId)
            const eventName = event ? `${team?.name} vs ${event.opponent}` : "Unknown Event"

            return <RequestListItem key={request.id} request={request} eventName={eventName} showEventName={true} />
          })}
        </CardContent>
      </Card>
    </div>
  )
}
