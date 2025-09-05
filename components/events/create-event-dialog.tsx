"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWorkspace } from "@/hooks/use-workspace"
import { useEvents } from "@/hooks/use-events"
import { Plus, Trash2 } from "lucide-react"

export function CreateEventDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    teamId: "",
    opponent: "",
    date: "",
    time: "",
    isPlayoff: false,
    additionalSuites: "",
  })
  const [customTickets, setCustomTickets] = useState<Array<{ section: string; row: string; seat: string }>>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { workspace } = useWorkspace()
  const { createEvent } = useEvents()

  const enabledTeams = workspace?.teams.filter((team) => team.enabled) || []

  const getDefaultTime = (teamId: string) => {
    const team = enabledTeams.find((t) => t.id === teamId)
    if (!team) return ""

    if (team.name === "Denver Broncos") return "14:25"
    return "19:00" // 7:00 PM for Avalanche, Nuggets, and Concerts
  }

  const getDefaultTicketValue = (teamId: string, seatType: string) => {
    if (!workspace?.ticketValues) return "0"

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const seasonStartYear = currentMonth >= 9 ? currentDate.getFullYear() : currentDate.getFullYear() - 1
    const currentSeason = `${seasonStartYear}-${seasonStartYear + 1}`

    // Find ticket value for this team, seat type, and current season
    const ticketValue = workspace.ticketValues.find(
      (tv: any) => tv.teamId === teamId && tv.seatType === seatType && tv.season === currentSeason,
    )

    if (ticketValue) {
      return ticketValue.value?.toString() || "0"
    }

    // Fallback: try to find any seat type for this team in current season
    const teamValues = workspace.ticketValues.filter((tv: any) => tv.teamId === teamId && tv.season === currentSeason)
    if (teamValues.length > 0) {
      return teamValues[0].value?.toString() || "0"
    }

    return "0"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.teamId || !formData.opponent || !formData.date || !formData.time) {
      setError("Please fill in all required fields")
      return
    }

    const additionalSuites = Number.parseInt(formData.additionalSuites) || 0
    if (additionalSuites < 0) {
      setError("Additional suites cannot be negative")
      return
    }

    setLoading(true)

    try {
      const selectedTeam = enabledTeams.find((team) => team.id === formData.teamId)
      if (!selectedTeam) {
        setError("Selected team not found")
        return
      }

      const eventData = {
        teamId: formData.teamId,
        opponent: formData.opponent,
        date: formData.date,
        time: formData.time,
        isPlayoff: formData.isPlayoff,
        additionalSuites,
        customTickets,
      }

      createEvent(eventData, selectedTeam.seatTypes)

      // Reset form and close dialog
      setFormData({
        teamId: "",
        opponent: "",
        date: "",
        time: "",
        isPlayoff: false,
        additionalSuites: "",
      })
      setCustomTickets([])
      setOpen(false)
    } catch (err) {
      setError("An error occurred while creating the event")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      if (field === "teamId" && typeof value === "string") {
        updated.time = getDefaultTime(value)
      }

      return updated
    })
  }

  const addCustomTicket = () => {
    setCustomTickets([...customTickets, { section: "", row: "", seat: "" }])
  }

  const updateCustomTicket = (index: number, field: string, value: string) => {
    const updated = [...customTickets]
    updated[index] = { ...updated[index], [field]: value }
    setCustomTickets(updated)
  }

  const removeCustomTicket = (index: number) => {
    setCustomTickets(customTickets.filter((_, i) => i !== index))
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
        options.push({ value: timeString, label: displayTime })
      }
    }
    return options
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>Add a new event to your schedule</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="team">Team *</Label>
            <Select value={formData.teamId} onValueChange={(value) => handleChange("teamId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {enabledTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded ${team.color}`} />
                      <span>{team.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opponent">Opponent/Event Name *</Label>
            <Input
              id="opponent"
              value={formData.opponent}
              onChange={(e) => handleChange("opponent", e.target.value)}
              placeholder="Enter opponent or event name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Select value={formData.time} onValueChange={(value) => handleChange("time", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {generateTimeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Tickets</Label>
            <div className="space-y-2">
              {customTickets.map((ticket, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Section"
                    value={ticket.section}
                    onChange={(e) => updateCustomTicket(index, "section", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Row"
                    value={ticket.row}
                    onChange={(e) => updateCustomTicket(index, "row", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Seat"
                    value={ticket.seat}
                    onChange={(e) => updateCustomTicket(index, "seat", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeCustomTicket(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addCustomTicket} className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Ticket
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPlayoff"
              checked={formData.isPlayoff}
              onCheckedChange={(checked) => handleChange("isPlayoff", checked as boolean)}
            />
            <Label htmlFor="isPlayoff">Playoff Game</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
