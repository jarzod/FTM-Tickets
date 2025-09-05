"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePeople } from "@/hooks/use-people"
import type { Ticket } from "@/lib/events"
import { User, Building, Trash2 } from "lucide-react" // Import Trash2 icon

interface TicketAssignmentRowProps {
  ticket: Ticket
  onUpdate: (ticketId: string, field: string, value: string | boolean | number) => void
  onDelete?: (ticketId: string) => void // Add onDelete prop
  onBulkSelect?: (ticketId: string, selected: boolean) => void
  isSelected?: boolean
  showBulkSelect?: boolean
}

export function TicketAssignmentRow({
  ticket,
  onUpdate,
  onDelete, // Add onDelete to props
  onBulkSelect,
  isSelected = false,
  showBulkSelect = false,
}: TicketAssignmentRowProps) {
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)
  const [nameQuery, setNameQuery] = useState(ticket.assignedTo || "")
  const [companyQuery, setCompanyQuery] = useState(ticket.assignedCompany || "")
  const [customPrice, setCustomPrice] = useState(ticket.price?.toString() || "0")

  const nameInputRef = useRef<HTMLInputElement>(null)
  const { searchPeople, addOrUpdatePerson, addAssignmentHistory } = usePeople()

  const nameSuggestions = nameQuery.length >= 2 ? searchPeople(nameQuery) : []

  useEffect(() => {
    setNameQuery(ticket.assignedTo || "")
    setCompanyQuery(ticket.assignedCompany || "")
    setCustomPrice(ticket.price?.toString() || "0")
  }, [ticket])

  const handleNameChange = (value: string) => {
    setNameQuery(value)
    onUpdate(ticket.id, "assignedTo", value)

    if (!value) {
      onUpdate(ticket.id, "assignmentType", "")
      onUpdate(ticket.id, "status", "")
      onUpdate(ticket.id, "price", 0)
      setCustomPrice("0")
    }
  }

  const handleCompanyChange = (value: string) => {
    setCompanyQuery(value)
    onUpdate(ticket.id, "assignedCompany", value)
  }

  const handleNameSuggestionSelect = (person: { name: string; company: string }) => {
    setNameQuery(person.name)
    setCompanyQuery(person.company)
    onUpdate(ticket.id, "assignedTo", person.name)
    onUpdate(ticket.id, "assignedCompany", person.company)
    setShowNameSuggestions(false)
  }

  const handleAssignmentTypeChange = (type: string) => {
    onUpdate(ticket.id, "assignmentType", type)

    if (type === "sold") {
      onUpdate(ticket.id, "price", ticket.value || 0)
      setCustomPrice((ticket.value || 0).toString())
      // Default status for sold tickets is tentative
      if (!ticket.status) {
        onUpdate(ticket.id, "status", "tentative")
      }
    } else {
      onUpdate(ticket.id, "price", 0)
      setCustomPrice("0")
      onUpdate(ticket.id, "confirmed", false)
      // Default status for non-sold tickets is tentative
      if (!ticket.status) {
        onUpdate(ticket.id, "status", "tentative")
      }
    }

    if (ticket.assignedTo && ticket.assignedCompany) {
      addOrUpdatePerson({
        name: ticket.assignedTo,
        company: ticket.assignedCompany || "",
      })

      addAssignmentHistory(ticket.assignedTo, ticket.assignedCompany || "", {
        eventId: ticket.id,
        eventName: `${ticket.seatType} Assignment`,
        assignmentType: type as any,
        price: type === "sold" ? ticket.value || 0 : 0,
        date: new Date().toISOString(),
        seatType: ticket.seatType,
        confirmed: false,
      })
    }
  }

  const handlePriceChange = (value: string) => {
    setCustomPrice(value)
    const price = Number.parseFloat(value) || 0
    onUpdate(ticket.id, "price", price)
  }

  const handleValueChange = (value: string) => {
    const ticketValue = Number.parseFloat(value) || 0
    onUpdate(ticket.id, "value", ticketValue)
  }

  const handleConfirmationChange = (confirmed: boolean) => {
    onUpdate(ticket.id, "confirmed", confirmed)

    // Add to assignment history when confirmed
    if (confirmed && ticket.assignedTo && ticket.assignedCompany) {
      addOrUpdatePerson({
        name: ticket.assignedTo,
        company: ticket.assignedCompany || "",
      })
    }
  }

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case "sold":
        return "bg-green-100 text-green-800 border-green-200"
      case "team":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "donated":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "gifted":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "traded":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSelectTriggerStyle = (type: string) => {
    if (type === "sold") {
      return "bg-green-50 border-green-200 text-green-800 font-medium"
    }
    return "bg-gray-50 border-gray-200 text-gray-600"
  }

  return (
    <div
      className={`relative p-3 border rounded-lg transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <div className="flex items-center gap-4">
        {/* Seat Type - Always visible on the left */}
        <div className="w-24 flex-shrink-0">
          <div className="font-medium text-sm">{ticket.customName ? ticket.customName : ticket.seatType}</div>
        </div>

        {/* Name Assignment with Search */}
        <div className="flex-1 min-w-0 relative">
          <div className="relative">
            <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              ref={nameInputRef}
              placeholder="Assign to person..."
              value={nameQuery}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => setShowNameSuggestions(true)}
              onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
              className="pl-7 h-8 text-sm"
            />
          </div>

          {/* Name Suggestions Dropdown */}
          {showNameSuggestions && nameSuggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
              <CardContent className="p-2">
                {nameSuggestions.map((person) => (
                  <Button
                    key={person.id}
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => handleNameSuggestionSelect(person)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{person.name}</div>
                      <div className="text-xs text-muted-foreground">{person.company}</div>
                      <div className="text-xs text-muted-foreground">
                        {person.assignmentHistory.length} previous assignments
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Company Assignment */}
        <div className="w-40 flex-shrink-0">
          <div className="relative">
            <Building className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Company..."
              value={companyQuery}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
        </div>

        {/* Source field for tracking ticket origin */}
        {ticket.customName && (
          <div className="w-32 flex-shrink-0">
            <Input
              placeholder="Source..."
              value={ticket.source || ""}
              onChange={(e) => onUpdate(ticket.id, "source", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* Assignment Type */}
        <div className="w-24 flex-shrink-0">
          <Select value={ticket.assignmentType || ""} onValueChange={handleAssignmentTypeChange}>
            <SelectTrigger className={`h-8 text-sm ${getSelectTriggerStyle(ticket.assignmentType || "")}`}>
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="donated">Donated</SelectItem>
              <SelectItem value="gifted">Gifted</SelectItem>
              <SelectItem value="traded">Traded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Value Field - Always visible */}
          <div className="flex flex-col items-center">
            <div className="text-xs text-muted-foreground mb-1">Value</div>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={(ticket.value || 0).toString()}
              onChange={(e) => handleValueChange(e.target.value)}
              className="h-8 text-sm w-20 text-center"
              placeholder="0"
            />
          </div>

          {/* Sold Price Field - Only visible when sold */}
          {ticket.assignmentType === "sold" && (
            <div className="flex flex-col items-center">
              <div className="text-xs text-muted-foreground mb-1">Sold Price</div>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={customPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="h-8 text-sm w-20 text-center"
                placeholder={(ticket.value || 0).toString()}
              />
            </div>
          )}

          {/* Status Field - Only visible when assigned */}
          {ticket.assignedTo && (
            <div className="flex flex-col items-center">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <Select
                value={ticket.status || "tentative"}
                onValueChange={(status) => onUpdate(ticket.id, "status", status)}
              >
                <SelectTrigger className="h-8 text-sm w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tentative">Tentative</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Delete Button - Only show if onDelete prop is provided */}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(ticket.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
