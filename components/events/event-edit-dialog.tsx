"use client"

import type React from "react"
import { format } from "date-fns"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useWorkspace } from "@/hooks/use-workspace"
import { useEvents } from "@/hooks/use-events"
import { usePeople } from "@/hooks/use-people"
import { TicketAssignmentRow } from "./ticket-assignment-row"
import { Trash2, Save, MessageSquare } from "lucide-react"
import { AdminRequestItem } from "@/components/requests/admin-request-item"
import { getRequestsByEventId } from "@/lib/requests"

interface EventEditDialogProps {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventEditDialog({ eventId, open, onOpenChange }: EventEditDialogProps) {
  const [formData, setFormData] = useState({
    opponent: "",
    date: "",
    time: "",
    isPlayoff: false,
  })
  const [customTicket, setCustomTicket] = useState({
    section: "",
    row: "",
    seat: "",
    value: "",
    source: "", // Added source field to custom ticket form
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { workspace } = useWorkspace()
  const {
    getEventById,
    updateEvent,
    deleteEvent,
    updateTicketAssignment,
    getEventStats,
    addCustomTicket,
    deleteTicket,
  } = useEvents()
  const { addAssignmentHistory } = usePeople()

  const event = getEventById(eventId)
  const team = workspace?.teams.find((t) => t.id === event?.teamId)
  const stats = event ? getEventStats(event) : null

  useEffect(() => {
    if (event) {
      setFormData({
        opponent: event.opponent,
        date: event.date,
        time: event.time,
        isPlayoff: event.isPlayoff,
      })
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.opponent || !formData.date || !formData.time) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const updates = {
        opponent: formData.opponent,
        date: formData.date,
        time: formData.time,
        isPlayoff: formData.isPlayoff,
      }

      updateEvent(eventId, updates)
      onOpenChange(false)
    } catch (err) {
      setError("An error occurred while updating the event")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomTicket = () => {
    if (!customTicket.section || !customTicket.row || !customTicket.seat || !customTicket.value) {
      setError("Please fill in all custom ticket fields")
      return
    }

    const value = Number.parseFloat(customTicket.value)
    if (isNaN(value) || value < 0) {
      setError("Please enter a valid ticket value")
      return
    }

    try {
      const newTicket = addCustomTicket(eventId, customTicket.section, customTicket.row, customTicket.seat, value)
      if (newTicket && customTicket.source) {
        handleTicketAssignment(newTicket.id, "source", customTicket.source)
      }
      setCustomTicket({ section: "", row: "", seat: "", value: "", source: "" })
      setError("")
    } catch (err) {
      setError("Failed to add custom ticket")
    }
  }

  const handleTicketAssignment = (ticketId: string, field: string, value: string | boolean | number) => {
    if (!event) return

    const ticket = event.tickets.find((t) => t.id === ticketId)
    if (!ticket) return

    const updates: any = { [field]: value }

    if (field === "assignmentType") {
      updates.price = value === "sold" ? ticket.value : 0
      if (value !== "sold") {
        updates.confirmed = false
      }
    }

    if (field === "confirmed" && value === true && ticket.assignedTo && ticket.assignedCompany) {
      addAssignmentHistory(ticket.assignedTo, ticket.assignedCompany, {
        eventId: event.id,
        eventName: `${team?.name} vs ${event.opponent}`,
        date: event.date,
        seatType: ticket.seatType,
        assignmentType: ticket.assignmentType,
        price: ticket.price,
        confirmed: true,
      })
    }

    updateTicketAssignment(eventId, ticketId, updates)
  }

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case "sold":
        return "bg-green-100 text-green-800"
      case "team":
        return "bg-blue-100 text-blue-800"
      case "donated":
        return "bg-purple-100 text-purple-800"
      case "gifted":
        return "bg-orange-100 text-orange-800"
      case "traded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDelete = async () => {
    try {
      deleteEvent(eventId)
      onOpenChange(false)
    } catch (err) {
      setError("An error occurred while deleting the event")
    }
  }

  const formatEventDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number)
    const localDate = new Date(year, month - 1, day)
    return format(localDate, "MMM d, yyyy")
  }

  const handleDeleteTicket = (ticketId: string) => {
    if (window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      deleteTicket(eventId, ticketId)
    }
  }

  if (!event || !team) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded ${team.color}`} />
            <div>
              <DialogTitle>{event.opponent}</DialogTitle>
              <DialogDescription>
                {team.name} • {formatEventDate(event.date)} at {event.time}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold">{stats.totalTickets}</div>
                <div className="text-sm text-muted-foreground">Total Tickets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-accent">{stats.assignedTickets}</div>
                <div className="text-sm text-muted-foreground">Assigned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">{stats.soldTickets}</div>
                <div className="text-sm text-muted-foreground">Sold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">${stats.confirmedRevenue.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Revenue</div>
              </div>
            </div>
          )}

          <Separator />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opponent">Opponent/Event Name</Label>
                <Input
                  id="opponent"
                  value={formData.opponent}
                  onChange={(e) => setFormData((prev) => ({ ...prev, opponent: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  step="300"
                  value={formData.time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPlayoff"
                checked={formData.isPlayoff}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPlayoff: checked as boolean }))}
              />
              <Label htmlFor="isPlayoff">Playoff Game</Label>
            </div>
          </form>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ticket Assignments</h3>
            </div>

            <div className="space-y-3">
              {event.tickets.map((ticket) => (
                <TicketAssignmentRow
                  key={ticket.id}
                  ticket={ticket}
                  onUpdate={handleTicketAssignment}
                  onDelete={handleDeleteTicket}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Custom Ticket</h3>
            <div className="grid grid-cols-5 gap-4">
              {" "}
              {/* Changed from 4 to 5 columns for source field */}
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={customTicket.section}
                  onChange={(e) => setCustomTicket((prev) => ({ ...prev, section: e.target.value }))}
                  placeholder="e.g., 101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="row">Row</Label>
                <Input
                  id="row"
                  value={customTicket.row}
                  onChange={(e) => setCustomTicket((prev) => ({ ...prev, row: e.target.value }))}
                  placeholder="e.g., A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seat">Seat</Label>
                <Input
                  id="seat"
                  value={customTicket.seat}
                  onChange={(e) => setCustomTicket((prev) => ({ ...prev, seat: e.target.value }))}
                  placeholder="e.g., 15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={customTicket.value}
                  onChange={(e) => setCustomTicket((prev) => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={customTicket.source}
                  onChange={(e) => setCustomTicket((prev) => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g., purchased, traded"
                />
              </div>
            </div>
            <Button type="button" onClick={handleAddCustomTicket}>
              Add Ticket
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ticket Requests</h3>
            <div className="space-y-3">
              {getRequestsByEventId(event.id).map((request) => (
                <AdminRequestItem key={request.id} request={request} event={event} />
              ))}
              {getRequestsByEventId(event.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                  <p>No ticket requests for this event</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between pt-4">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Event
            </Button>
            <Button type="submit" disabled={loading} onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
