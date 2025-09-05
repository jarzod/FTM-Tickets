"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspace } from "@/hooks/use-workspace"
import { useEvents } from "@/hooks/use-events"
import { useRequests } from "@/hooks/use-requests"
import { CreateEventDialog } from "./create-event-dialog"
import { EventEditDialog } from "./event-edit-dialog"
import { RequestTicketDialog } from "../requests/request-ticket-dialog"
import { Search, Calendar, Users, Star } from "lucide-react"
import { format } from "date-fns"

interface EventsListProps {
  isPublicView?: boolean
}

export function EventsList({ isPublicView = false }: EventsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  const { user } = useAuth()
  const { workspace } = useWorkspace()
  const { getFilteredEvents, getEventStats } = useEvents()
  const { getPendingRequestsCount, getRequestsByEventId } = useRequests()

  const enabledTeams = workspace?.teams.filter((team) => team.enabled) || []
  const isAdmin = user?.role === "admin" && !isPublicView

  const getMountainTime = (): Date => {
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const isDST = isDaylightSavingTime(now)
    const offset = isDST ? -6 : -7
    return new Date(utc + offset * 3600000)
  }

  const isDaylightSavingTime = (date: Date): boolean => {
    const year = date.getFullYear()
    const marchSecondSunday = new Date(year, 2, 8 + ((7 - new Date(year, 2, 8).getDay()) % 7))
    const novemberFirstSunday = new Date(year, 10, 1 + ((7 - new Date(year, 10, 1).getDay()) % 7))
    return date >= marchSecondSunday && date < novemberFirstSunday
  }

  const filteredEvents = getFilteredEvents({
    search: searchTerm,
    teamId: selectedTeam === "all" ? undefined : selectedTeam,
    showPastEvents,
  })
    .filter((event) => {
      if (!event || typeof event !== "object" || !event.id || !event.date || !event.teamId) {
        console.warn("[v0] Filtering out corrupted event:", event)
        return false
      }

      // Ensure tickets array exists and is valid
      if (!event.tickets || !Array.isArray(event.tickets)) {
        event.tickets = []
      }

      if (!showMyEventsOnly) return true

      return event.tickets.some((ticket: any) => {
        const assignedPerson = ticket?.assignedTo
        if (!assignedPerson) return false

        // For public users with selected ticketholder, check against ticketholder name
        if (user?.selectedTicketholder?.name) {
          return (
            assignedPerson.toLowerCase() === user.selectedTicketholder.name.toLowerCase() ||
            assignedPerson.toLowerCase().includes(user.selectedTicketholder.name.toLowerCase())
          )
        }

        // For admin users, check against user name
        if (user?.name) {
          return (
            assignedPerson.toLowerCase() === user.name.toLowerCase() ||
            assignedPerson.toLowerCase().includes(user.name.toLowerCase())
          )
        }

        return false
      })
    })
    .sort((a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } catch (error) {
        console.warn("[v0] Date sorting error:", error)
        return 0
      }
    })

  const getTeamInfo = (teamId: string) => {
    return enabledTeams.find((team) => team.id === teamId)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getAssignedNames = (event: any) => {
    if (!event || !event.tickets || !Array.isArray(event.tickets)) {
      return []
    }
    try {
      const assignedTickets = event.tickets.filter((ticket: any) => ticket && ticket.assignedTo)
      return assignedTickets.map((ticket: any) => ({
        name: ticket.assignedTo || "Unknown",
        seat: ticket.seatNumber || ticket.seatType || "Unknown",
        assignmentType: ticket.assignmentType || "assigned",
      }))
    } catch (error) {
      console.warn("[v0] Error getting assigned names:", error)
      return []
    }
  }

  const getRequestDetails = (eventId: string) => {
    const requests = getRequestsByEventId(eventId).filter((req) => req.status === "pending")
    return {
      count: requests.length,
      names: requests.map((req) => req.userName).slice(0, 3), // Show up to 3 names
    }
  }

  const formatEventDate = (dateString: string) => {
    try {
      if (!dateString || typeof dateString !== "string") {
        return "Invalid Date"
      }

      // Handle different date formats
      if (dateString.includes("-")) {
        const [year, month, day] = dateString.split("-").map(Number)
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          return "Invalid Date"
        }
        const localDate = new Date(year, month - 1, day)
        if (isNaN(localDate.getTime())) {
          return "Invalid Date"
        }
        return format(localDate, "MMM d, yyyy")
      } else {
        // Fallback for other date formats
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          return "Invalid Date"
        }
        return format(date, "MMM d, yyyy")
      }
    } catch (error) {
      console.error("[v0] Date formatting error:", error, "for date:", dateString)
      return "Invalid Date"
    }
  }

  const getSafeEventStats = (event: any) => {
    try {
      if (!event || !event.tickets || !Array.isArray(event.tickets)) {
        return {
          totalTickets: 0,
          assignedTickets: 0,
          soldTickets: 0,
          availableTickets: 0,
          confirmedRevenue: 0,
        }
      }
      return getEventStats(event)
    } catch (error) {
      console.warn("[v0] Error getting event stats:", error)
      return {
        totalTickets: 0,
        assignedTickets: 0,
        soldTickets: 0,
        availableTickets: 0,
        confirmedRevenue: 0,
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm w-full">
          <div className="p-3">
            <div className="flex flex-col gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 sm:max-w-48">
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="All teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {enabledTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full border border-gray-200"
                              style={{ backgroundColor: team.color }}
                            />
                            <span className="truncate">{team.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPast"
                      checked={showPastEvents}
                      onCheckedChange={(checked) => setShowPastEvents(checked as boolean)}
                      className="border-slate-300"
                    />
                    <Label htmlFor="showPast" className="text-sm text-slate-600 cursor-pointer whitespace-nowrap">
                      Show past events
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showMyEvents"
                      checked={showMyEventsOnly}
                      onCheckedChange={(checked) => setShowMyEventsOnly(checked as boolean)}
                      className="border-slate-300"
                    />
                    <Label htmlFor="showMyEvents" className="text-sm text-slate-600 cursor-pointer whitespace-nowrap">
                      My events
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="w-full sm:w-auto">
            <CreateEventDialog />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-slate-900">No events found</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || selectedTeam !== "all" || showMyEventsOnly
                  ? "Try adjusting your filters or search terms"
                  : isPublicView
                    ? "No events are currently available for ticket requests"
                    : "Get started by creating your first event"}
              </p>
              {!searchTerm && selectedTeam === "all" && !showMyEventsOnly && isAdmin && <CreateEventDialog />}
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => {
            const team = getTeamInfo(event.teamId)
            const stats = getSafeEventStats(event)
            const eventDate = new Date(event.date + "T" + event.time)
            const mountainTime = getMountainTime()
            const eventMountainTime = new Date(
              eventDate.getTime() - (mountainTime.getTimezoneOffset() - eventDate.getTimezoneOffset()) * 60000,
            )
            const isPastEvent = eventMountainTime < mountainTime
            const pendingRequests = getPendingRequestsCount(event.id)
            const assignedNames = getAssignedNames(event)

            return (
              <Card
                key={event.id}
                className={`hover:shadow-lg transition-all duration-200 border-slate-200 py-0 ${isPastEvent ? "opacity-75" : ""} ${
                  isAdmin ? "cursor-pointer hover:border-blue-300" : ""
                }`}
                onClick={isAdmin ? () => setSelectedEvent(event.id) : undefined}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        {team && (
                          <Badge
                            style={{ backgroundColor: team.color }}
                            className="text-white border-0 px-3 py-1 rounded-full font-medium text-xs sm:text-sm w-fit"
                          >
                            {team.name}
                          </Badge>
                        )}
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{event.opponent}</h3>
                        {event.isPlayoff && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 rounded-full w-fit">
                            <Star className="h-3 w-3 mr-1" />
                            Playoff
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{formatEventDate(event.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>{formatTime(event.time)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                        <div className="flex items-center space-x-1 text-slate-600">
                          <Users className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className={stats.availableTickets > 0 ? "font-bold" : ""}>
                            {stats.availableTickets}/{stats.totalTickets} available
                          </span>
                        </div>
                        {(() => {
                          const requestDetails = getRequestDetails(event.id)
                          return requestDetails.count > 0 ? (
                            <div className="text-xs text-blue-600">
                              <span className="font-medium">{requestDetails.count} Requests:</span>{" "}
                              <span className="truncate">{requestDetails.names.join(", ")}</span>
                              {requestDetails.count > 3 && <span>, +{requestDetails.count - 3} more</span>}
                            </div>
                          ) : null
                        })()}
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end space-y-2 sm:text-right min-w-0">
                      {!isPublicView && assignedNames.length > 0 && (
                        <div className="text-sm text-slate-600 w-full sm:max-w-xs">
                          <div className="space-y-1">
                            {assignedNames.slice(0, 3).map((assignment: any, index: number) => (
                              <div
                                key={index}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2"
                              >
                                <div className="order-2 sm:order-1">
                                  <span className="text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded whitespace-nowrap">
                                    {assignment.seat}
                                  </span>
                                </div>
                                <div className="order-1 sm:order-2 flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                    <span className="text-slate-900 font-normal truncate">{assignment.name}</span>
                                    <span
                                      className={`text-xs px-1 py-0.5 rounded whitespace-nowrap ${
                                        assignment.assignmentType === "sold"
                                          ? "bg-green-100 text-green-700"
                                          : assignment.assignmentType === "team"
                                            ? "bg-blue-100 text-blue-700"
                                            : assignment.assignmentType === "donated"
                                              ? "bg-purple-100 text-purple-700"
                                              : assignment.assignmentType === "gifted"
                                                ? "bg-pink-100 text-pink-700"
                                                : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {assignment.assignmentType}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {assignedNames.length > 3 && (
                              <div className="text-xs text-slate-500 italic">
                                +{assignedNames.length - 3} more assigned
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {isPublicView && !isPastEvent && (
                        <div className="w-full sm:w-auto">
                          <RequestTicketDialog event={event} />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {isAdmin && selectedEvent && (
        <EventEditDialog
          eventId={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
