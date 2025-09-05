"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useRequests } from "@/hooks/use-requests"
import { useWorkspace } from "@/hooks/use-workspace"
import type { Event } from "@/lib/events"
import { HandHeart, Clock, Star } from "lucide-react"
import { Input } from "@/components/ui/input"

interface RequestTicketDialogProps {
  event: Event
  disabled?: boolean
}

export function RequestTicketDialog({ event, disabled = false }: RequestTicketDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    priority: "" as "want" | "need" | "nice-to-have" | "",
    message: "",
    overrideName: "",
    overrideCompany: "",
    overrideEmail: "",
    overridePhone: "",
    ticketQuantities: [] as number[],
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const { workspace } = useWorkspace()
  const { createRequest, hasUserRequestedEvent } = useRequests()

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && user?.selectedTicketholder) {
      setFormData((prev) => ({
        ...prev,
        overrideName: user.selectedTicketholder.name || "",
        overrideCompany: user.selectedTicketholder.company || "",
        overrideEmail: user.selectedTicketholder.email || "",
        overridePhone: user.selectedTicketholder.phone || "",
      }))
    } else if (newOpen && user) {
      // Fallback to user data if no selectedTicketholder
      setFormData((prev) => ({
        ...prev,
        overrideName: user.name || "",
        overrideCompany: user.company || "",
        overrideEmail: user.email || "",
        overridePhone: user.phone || "",
      }))
    }
  }

  const team = workspace?.teams.find((t) => t.id === event.teamId)
  const hasAlreadyRequested = user ? hasUserRequestedEvent(user.id, event.id) : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!user) {
      setError("You must be logged in to request tickets")
      return
    }

    if (!formData.priority) {
      setError("Please select a priority level")
      return
    }

    if (formData.ticketQuantities.length === 0) {
      setError("Please select at least one ticket quantity option")
      return
    }

    if (hasAlreadyRequested) {
      setError("You have already requested tickets for this event")
      return
    }

    setLoading(true)

    try {
      createRequest({
        eventId: event.id,
        userId: user.id,
        userName: formData.overrideName || user.name,
        userEmail: formData.overrideEmail || user.email,
        userCompany: formData.overrideCompany || user.company,
        userPhone: formData.overridePhone || user.phone,
        priority: formData.priority,
        message: formData.message.trim() || undefined,
        ticketQuantities: formData.ticketQuantities,
      })

      setFormData({
        priority: "",
        message: "",
        overrideName: "",
        overrideCompany: "",
        overrideEmail: "",
        overridePhone: "",
        ticketQuantities: [],
      })
      setOpen(false)
    } catch (err) {
      setError("An error occurred while submitting your request")
    } finally {
      setLoading(false)
    }
  }

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case "want":
        return {
          label: "Want",
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
          description: "I would like tickets if available",
        }
      case "need":
        return {
          label: "Need",
          color: "bg-orange-100 text-orange-800",
          icon: Star,
          description: "I really need these tickets",
        }
      case "nice-to-have":
        return {
          label: "Nice to Have",
          color: "bg-blue-100 text-blue-800",
          icon: HandHeart,
          description: "Would be nice but not essential",
        }
      default:
        return { label: "", color: "", icon: Clock, description: "" }
    }
  }

  const handleQuantityChange = (quantity: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      ticketQuantities: checked
        ? [...prev.ticketQuantities, quantity].sort((a, b) => a - b)
        : prev.ticketQuantities.filter((q) => q !== quantity),
    }))
  }

  if (!user || hasAlreadyRequested) {
    return (
      <Button disabled variant="outline" size="sm">
        {!user ? "Login to Request" : "Already Requested"}
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={disabled} size="sm">
          <HandHeart className="h-4 w-4 mr-2" />
          Request Tickets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {team && <div className={`w-4 h-4 rounded ${team.color}`} />}
            <div>
              <DialogTitle>Request Tickets</DialogTitle>
              <DialogDescription>
                {team?.name} vs {event.opponent} • {event.date}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Request Details (editable for requesting on behalf of others)</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={formData.overrideName || user?.name || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, overrideName: e.target.value }))}
                  placeholder={user?.name || "Enter name"}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Company</Label>
                <Input
                  value={formData.overrideCompany || user?.company || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, overrideCompany: e.target.value }))}
                  placeholder={user?.company || "Enter company"}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  value={formData.overrideEmail || user?.email || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, overrideEmail: e.target.value }))}
                  placeholder={user?.email || "Enter email"}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={formData.overridePhone || user?.phone || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, overridePhone: e.target.value }))}
                  placeholder={user?.phone || "Enter phone"}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Number of Tickets Requested *</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((quantity) => (
                <label key={quantity} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ticketQuantities.includes(quantity)}
                    onChange={(e) => handleQuantityChange(quantity, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">
                    {quantity} ticket{quantity > 1 ? "s" : ""}
                  </span>
                </label>
              ))}
            </div>
            {formData.ticketQuantities.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Selected: {formData.ticketQuantities.join(", ")} ticket{formData.ticketQuantities.length > 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level *</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="need">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-orange-600" />
                    <span>Need - High Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="want">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Want - Medium Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="nice-to-have">
                  <div className="flex items-center space-x-2">
                    <HandHeart className="h-4 w-4 text-blue-600" />
                    <span>Nice to Have - Low Priority</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {formData.priority && (
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityInfo(formData.priority).color}>
                  {getPriorityInfo(formData.priority).label}
                </Badge>
                <span className="text-sm text-muted-foreground">{getPriorityInfo(formData.priority).description}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Any additional information about your request..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
