"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import {
  type Event,
  type Ticket,
  createEvent,
  updateEvent,
  deleteEvent,
  updateTicketAssignment,
  getEventStats,
  addCustomTicket,
  deleteTicket,
} from "@/lib/events"

import { getEvents } from "@/lib/events"

interface EventsContextType {
  events: Event[]
  loading: boolean
  createEvent: (
    eventData: Omit<Event, "id" | "tickets" | "createdAt" | "updatedAt">,
    seatTypes: { id: string; name: string }[],
  ) => Event
  updateEvent: (eventId: string, updates: Partial<Event>) => Event | null
  deleteEvent: (eventId: string) => boolean
  getEventById: (eventId: string) => Event | null
  updateTicketAssignment: (eventId: string, ticketId: string, assignment: any) => Ticket | null
  getFilteredEvents: (filters: any) => Event[]
  getEventStats: (event: Event) => any
  addCustomTicket: (eventId: string, section: string, row: string, seat: string, value: number) => Ticket | null
  deleteTicket: (eventId: string, ticketId: string) => boolean
  refreshEvents: () => void
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEventsState] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const refreshEvents = async () => {
    try {
      const currentEvents = await getEvents()
      setEventsState(Array.isArray(currentEvents) ? currentEvents : [])
    } catch (error) {
      console.error("Error refreshing events:", error)
      setEventsState([])
    }
  }

  useEffect(() => {
    refreshEvents().finally(() => setLoading(false))
  }, [])

  const createEventHandler = async (
    eventData: Omit<Event, "id" | "tickets" | "createdAt" | "updatedAt">,
    seatTypes: { id: string; name: string }[],
  ): Promise<Event> => {
    const newEvent = await createEvent(eventData, seatTypes)
    await refreshEvents()
    return newEvent
  }

  const updateEventHandler = async (eventId: string, updates: Partial<Event>): Promise<Event | null> => {
    const updated = await updateEvent(eventId, updates)
    if (updated) {
      await refreshEvents()
    }
    return updated
  }

  const deleteEventHandler = async (eventId: string): Promise<boolean> => {
    const deleted = await deleteEvent(eventId)
    if (deleted) {
      await refreshEvents()
    }
    return deleted
  }

  const updateTicketAssignmentHandler = async (
    eventId: string,
    ticketId: string,
    assignment: any,
  ): Promise<Ticket | null> => {
    const updated = await updateTicketAssignment(eventId, ticketId, assignment)
    if (updated) {
      await refreshEvents()
    }
    return updated
  }

  const addCustomTicketHandler = async (
    eventId: string,
    section: string,
    row: string,
    seat: string,
    value: number,
  ): Promise<Ticket | null> => {
    const newTicket = await addCustomTicket(eventId, section, row, seat, value)
    if (newTicket) {
      await refreshEvents()
    }
    return newTicket
  }

  const deleteTicketHandler = async (eventId: string, ticketId: string): Promise<boolean> => {
    const deleted = await deleteTicket(eventId, ticketId)
    if (deleted) {
      await refreshEvents()
    }
    return deleted
  }

  const getFilteredEventsHandler = (filters: {
    search?: string
    teamId?: string
    showPastEvents?: boolean
  }) => {
    if (!Array.isArray(events)) {
      return []
    }

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

  const getEventStatsHandler = (event: Event) => {
    return getEventStats(event)
  }

  const getEventByIdHandler = (eventId: string) => {
    return events.find((event) => event.id === eventId) || null
  }

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        createEvent: createEventHandler,
        updateEvent: updateEventHandler,
        deleteEvent: deleteEventHandler,
        getEventById: getEventByIdHandler,
        updateTicketAssignment: updateTicketAssignmentHandler,
        getFilteredEvents: getFilteredEventsHandler,
        getEventStats: getEventStatsHandler,
        addCustomTicket: addCustomTicketHandler,
        deleteTicket: deleteTicketHandler,
        refreshEvents,
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const context = useContext(EventsContext)
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventsProvider")
  }
  return context
}
