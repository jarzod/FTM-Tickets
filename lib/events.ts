export interface Ticket {
  id: string
  eventId: string
  seatType: string
  customName?: string // Added customName field for proper display formatting
  section?: string
  row?: string
  seat?: string
  value: number // Added built-in ticket value
  source?: string // Added source field to track ticket origin (purchased, traded, etc.)
  assignedTo?: string
  assignedCompany?: string
  assignmentType: "sold" | "team" | "donated" | "gifted" | "traded"
  status?: "tentative" | "confirmed" | "transferred"
  price: number
  confirmed: boolean
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  teamId: string
  opponent: string
  date: string
  time: string
  isPlayoff: boolean
  tickets: Ticket[]
  createdAt: string
  updatedAt: string
}

const EVENTS_STORAGE_KEY = "ticket_scheduler_events"

// Get all events from localStorage
export function getEvents(): Event[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY)
    if (stored) {
      const events = JSON.parse(stored)
      return Array.isArray(events) ? events.filter(isValidEvent) : []
    }
  } catch (error) {
    console.error("Error reading events:", error)
  }

  return []
}

function isValidEvent(event: any): event is Event {
  return (
    event &&
    typeof event === "object" &&
    typeof event.id === "string" &&
    typeof event.teamId === "string" &&
    typeof event.opponent === "string" &&
    typeof event.date === "string" &&
    typeof event.time === "string" &&
    Array.isArray(event.tickets)
  )
}

// Save events to localStorage
export function setEvents(events: Event[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
  } catch (error) {
    console.error("Error saving events:", error)
  }
}

// Create a new event
export function createEvent(
  eventData: Omit<Event, "id" | "tickets" | "createdAt" | "updatedAt">,
  seatTypes: { id: string; name: string; value: number }[], // Added value to seat types
): Event {
  const eventId = crypto.randomUUID()

  const workspace =
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("ticket_scheduler_workspace") || "{}") : {}

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1
  const currentSeason = `${seasonStartYear}-${seasonStartYear + 1}`

  // Get configured seat types from admin ticket values for this team and season
  const ticketValues = workspace.ticketValues || []
  const teamSeatTypes = Array.isArray(ticketValues)
    ? ticketValues.filter((tv: any) => tv.teamId === eventData.teamId && tv.season === currentSeason)
    : []

  // Generate tickets for each configured seat type
  const tickets: Ticket[] = []

  if (teamSeatTypes.length > 0) {
    teamSeatTypes.forEach((seatConfig: any, index: number) => {
      const seatTypeName = seatConfig.seatType || `Seat ${index + 1}`
      tickets.push({
        id: crypto.randomUUID(),
        eventId,
        seatType: seatTypeName, // Use the exact seat type name from admin
        section: seatTypeName, // Store the seat type as section
        row: "1", // Default row
        seat: (index + 1).toString(), // Sequential seat number
        value: seatConfig.value || 0, // Use admin-configured value
        source: seatConfig.source || "", // Use admin-configured source
        assignmentType: "", // Empty string instead of defaulting to sold
        price: 0, // Default price to 0 until assigned and sold
        confirmed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })
  } else {
    // Fallback to provided seat types if no admin configuration exists
    seatTypes.forEach((seatType, index) => {
      const seatNumber = index + 1
      const seatIdentifier = `${seatType.name} ${seatNumber}`

      tickets.push({
        id: crypto.randomUUID(),
        eventId,
        seatType: seatType.name, // Use just the seat type name without extra numbering
        section: seatType.name, // Store the base seat type as section
        row: "1", // Default row
        seat: seatNumber.toString(), // Specific seat number
        value: seatType.value || 0, // Use fallback value
        source: seatType.source || "", // Use fallback source
        assignmentType: "", // Empty string instead of defaulting to sold
        price: 0, // Default price to 0 until assigned and sold
        confirmed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })
  }

  const newEvent: Event = {
    ...eventData,
    id: eventId,
    tickets,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const events = getEvents()
  const updatedEvents = [...events, newEvent]
  setEvents(updatedEvents)

  return newEvent
}

// Update an event
export function updateEvent(eventId: string, updates: Partial<Event>): Event | null {
  const events = getEvents()
  const eventIndex = events.findIndex((e) => e.id === eventId)

  if (eventIndex === -1) return null

  const updatedEvent: Event = {
    ...events[eventIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  events[eventIndex] = updatedEvent
  setEvents(events)

  return updatedEvent
}

// Delete an event
export function deleteEvent(eventId: string): boolean {
  const events = getEvents()
  const filteredEvents = events.filter((e) => e.id !== eventId)

  if (filteredEvents.length === events.length) return false

  setEvents(filteredEvents)
  return true
}

// Get event by ID
export function getEventById(eventId: string): Event | null {
  const events = getEvents()
  return events.find((e) => e.id === eventId) || null
}

// Update ticket assignment
export function updateTicketAssignment(
  eventId: string,
  ticketId: string,
  assignment: {
    assignedTo?: string
    assignedCompany?: string
    assignmentType?: "sold" | "team" | "donated" | "gifted" | "traded"
    status?: "tentative" | "confirmed" | "transferred"
    price?: number
    confirmed?: boolean
  },
): Ticket | null {
  const events = getEvents()
  const eventIndex = events.findIndex((e) => e.id === eventId)

  if (eventIndex === -1) return null

  const event = events[eventIndex]
  const ticketIndex = event.tickets.findIndex((t) => t.id === ticketId)

  if (ticketIndex === -1) return null

  const ticket = event.tickets[ticketIndex]

  let price = assignment.price !== undefined ? assignment.price : ticket.price
  if (assignment.assignmentType === "sold") {
    // For sold tickets, use the provided price or the ticket's built-in value
    price = assignment.price !== undefined ? assignment.price : ticket.value
  } else if (assignment.assignmentType && assignment.assignmentType !== "sold") {
    // For non-revenue assignments, set price to 0
    price = 0
  }

  const updatedTicket: Ticket = {
    ...ticket,
    ...assignment,
    price,
    updatedAt: new Date().toISOString(),
  }

  event.tickets[ticketIndex] = updatedTicket
  event.updatedAt = new Date().toISOString()

  events[eventIndex] = event
  setEvents(events)

  return updatedTicket
}

// Get events with filtering
export function getFilteredEvents(filters: {
  search?: string
  teamId?: string
  showPastEvents?: boolean
}): Event[] {
  const events = getEvents()
  const now = getMountainTime()

  return events.filter((event) => {
    // Filter by past events
    if (!filters.showPastEvents) {
      const eventDate = new Date(event.date + "T" + event.time)
      const eventMountainTime = new Date(
        eventDate.getTime() - (getMountainTime().getTimezoneOffset() - eventDate.getTimezoneOffset()) * 60000,
      )
      if (eventMountainTime < now) return false
    }

    // Filter by team
    if (filters.teamId && event.teamId !== filters.teamId) {
      return false
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesOpponent = event.opponent.toLowerCase().includes(searchTerm)
      const matchesAssignedPeople = event.tickets.some(
        (ticket) =>
          ticket.assignedTo?.toLowerCase().includes(searchTerm) ||
          ticket.assignedCompany?.toLowerCase().includes(searchTerm),
      )

      if (!matchesOpponent && !matchesAssignedPeople) {
        return false
      }
    }

    return true
  })
}

// Get event statistics
export function getEventStats(event: Event) {
  if (!event || !event.tickets || !Array.isArray(event.tickets)) {
    return {
      totalTickets: 0,
      assignedTickets: 0,
      availableTickets: 0,
      soldTickets: 0,
      confirmedRevenue: 0,
      isSoldOut: false,
    }
  }

  const totalTickets = event.tickets.length
  const assignedTickets = event.tickets.filter((t) => t.assignedTo).length
  const availableTickets = totalTickets - assignedTickets

  // Only count tickets that are actually marked as "sold" assignment type
  const soldTickets = event.tickets.filter((t) => t.assignmentType === "sold" && t.assignedTo).length

  const confirmedRevenue = event.tickets
    .filter((t) => t.assignmentType === "sold" && t.status === "confirmed" && t.assignedTo)
    .reduce((sum, t) => sum + (t.price || 0), 0)

  return {
    totalTickets,
    assignedTickets,
    availableTickets,
    soldTickets,
    confirmedRevenue,
    isSoldOut: availableTickets === 0,
  }
}

export function addCustomTicket(
  eventId: string,
  section: string,
  row: string,
  seat: string,
  value: number,
): Ticket | null {
  const events = getEvents()
  const eventIndex = events.findIndex((e) => e.id === eventId)

  if (eventIndex === -1) return null

  const event = events[eventIndex]

  const newTicket: Ticket = {
    id: crypto.randomUUID(),
    eventId,
    seatType: `${section}-${row}-${seat}`,
    customName: `Section ${section}, Row ${row}, Seat ${seat}`, // Added proper comma formatting for custom tickets
    section,
    row,
    seat,
    value,
    source: "custom", // Default source for custom tickets
    assignmentType: "",
    price: 0,
    confirmed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  event.tickets.push(newTicket)
  event.updatedAt = new Date().toISOString()

  events[eventIndex] = event
  setEvents(events)

  return newTicket
}

// Delete individual tickets from events
export function deleteTicket(eventId: string, ticketId: string): boolean {
  const events = getEvents()
  const eventIndex = events.findIndex((e) => e.id === eventId)

  if (eventIndex === -1) return false

  const event = events[eventIndex]
  const ticketIndex = event.tickets.findIndex((t) => t.id === ticketId)

  if (ticketIndex === -1) return false

  event.tickets.splice(ticketIndex, 1)
  event.updatedAt = new Date().toISOString()

  events[eventIndex] = event
  setEvents(events)

  return true
}

function getMountainTime(): Date {
  const now = new Date()
  // Convert to Mountain Time (UTC-7 in standard time, UTC-6 in daylight time)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const mountainOffset = -7 // MST is UTC-7, MDT is UTC-6
  const isDST = isDaylightSavingTime(now)
  const offset = isDST ? -6 : -7
  return new Date(utc + offset * 3600000)
}

function isDaylightSavingTime(date: Date): boolean {
  // DST in US runs from second Sunday in March to first Sunday in November
  const year = date.getFullYear()
  const marchSecondSunday = new Date(year, 2, 8 + ((7 - new Date(year, 2, 8).getDay()) % 7))
  const novemberFirstSunday = new Date(year, 10, 1 + ((7 - new Date(year, 10, 1).getDay()) % 7))
  return date >= marchSecondSunday && date < novemberFirstSunday
}
