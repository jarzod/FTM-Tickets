"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import {
  type Event,
  type Ticket,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  updateTicketAssignment,
  getFilteredEvents,
  getEventStats,
  addCustomTicket,
  deleteTicket, // Import deleteTicket function
} from "@/lib/events"

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
  addCustomTicket: (eventId: string, section: string, row: string, seat: string, value: number) => Ticket | null // Add addCustomTicket to interface
  deleteTicket: (eventId: string, ticketId: string) => boolean // Add deleteTicket to interface
  refreshEvents: () => void
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEventsState] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const refreshEvents = () => {
    const currentEvents = getEvents()
    setEventsState(currentEvents)
  }

  useEffect(() => {
    refreshEvents()
    setLoading(false)
  }, [])

  const createEventHandler = (
    eventData: Omit<Event, "id" | "tickets" | "createdAt" | "updatedAt">,
    seatTypes: { id: string; name: string }[],
  ): Event => {
    const newEvent = createEvent(eventData, seatTypes)
    refreshEvents()
    return newEvent
  }

  const updateEventHandler = (eventId: string, updates: Partial<Event>): Event | null => {
    const updated = updateEvent(eventId, updates)
    if (updated) {
      refreshEvents()
    }
    return updated
  }

  const deleteEventHandler = (eventId: string): boolean => {
    const deleted = deleteEvent(eventId)
    if (deleted) {
      refreshEvents()
    }
    return deleted
  }

  const updateTicketAssignmentHandler = (eventId: string, ticketId: string, assignment: any): Ticket | null => {
    const updated = updateTicketAssignment(eventId, ticketId, assignment)
    if (updated) {
      refreshEvents()
    }
    return updated
  }

  const addCustomTicketHandler = (
    eventId: string,
    section: string,
    row: string,
    seat: string,
    value: number,
  ): Ticket | null => {
    const newTicket = addCustomTicket(eventId, section, row, seat, value)
    if (newTicket) {
      refreshEvents()
    }
    return newTicket
  }

  const deleteTicketHandler = (eventId: string, ticketId: string): boolean => {
    const deleted = deleteTicket(eventId, ticketId)
    if (deleted) {
      refreshEvents()
    }
    return deleted
  }

  const getFilteredEventsHandler = (filters: any) => {
    return getFilteredEvents(filters, events)
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
        addCustomTicket: addCustomTicketHandler, // Add addCustomTicket to provider value
        deleteTicket: deleteTicketHandler, // Add deleteTicket to provider value
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
