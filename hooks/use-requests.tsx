"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import {
  type TicketRequest,
  getRequests,
  createRequest,
  updateRequestStatus,
  getRequestsByEventId,
  getRequestsByUserId,
  getPendingRequestsCount,
  hasUserRequestedEvent,
  getRequestStats,
  deleteRequest,
} from "@/lib/requests"

interface RequestsContextType {
  requests: TicketRequest[]
  loading: boolean
  createRequest: (requestData: Omit<TicketRequest, "id" | "status" | "requestedAt">) => TicketRequest
  updateRequestStatus: (
    requestId: string,
    status: "approved" | "denied" | "completed",
    processedBy: string,
    assignedTicketId?: string,
  ) => TicketRequest | null
  getRequestsByEventId: (eventId: string) => TicketRequest[]
  getRequestsByUserId: (userId: string) => TicketRequest[]
  getPendingRequestsCount: (eventId: string) => number
  hasUserRequestedEvent: (userId: string, eventId: string) => boolean
  getRequestStats: () => any
  deleteRequest: (requestId: string) => boolean
  refreshRequests: () => void
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined)

export function RequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequestsState] = useState<TicketRequest[]>([])
  const [loading, setLoading] = useState(true)

  const refreshRequests = () => {
    const currentRequests = getRequests()
    setRequestsState(currentRequests)
  }

  useEffect(() => {
    refreshRequests()
    setLoading(false)
  }, [])

  const createRequestHandler = (requestData: Omit<TicketRequest, "id" | "status" | "requestedAt">): TicketRequest => {
    const newRequest = createRequest(requestData)
    refreshRequests()
    return newRequest
  }

  const updateRequestStatusHandler = (
    requestId: string,
    status: "approved" | "denied" | "completed",
    processedBy: string,
    assignedTicketId?: string,
  ): TicketRequest | null => {
    const updated = updateRequestStatus(requestId, status, processedBy, assignedTicketId)
    if (updated) {
      refreshRequests()
    }
    return updated
  }

  const deleteRequestHandler = (requestId: string): boolean => {
    const deleted = deleteRequest(requestId)
    if (deleted) {
      refreshRequests()
    }
    return deleted
  }

  return (
    <RequestsContext.Provider
      value={{
        requests,
        loading,
        createRequest: createRequestHandler,
        updateRequestStatus: updateRequestStatusHandler,
        getRequestsByEventId,
        getRequestsByUserId,
        getPendingRequestsCount,
        hasUserRequestedEvent,
        getRequestStats,
        deleteRequest: deleteRequestHandler,
        refreshRequests,
      }}
    >
      {children}
    </RequestsContext.Provider>
  )
}

export function useRequests() {
  const context = useContext(RequestsContext)
  if (context === undefined) {
    throw new Error("useRequests must be used within a RequestsProvider")
  }
  return context
}
