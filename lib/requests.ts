export interface TicketRequest {
  id: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  userCompany: string
  userPhone: string
  priority: "want" | "need" | "nice-to-have"
  message?: string
  requestedQuantities?: number[] // Array of quantities they're willing to accept (e.g., [1,2,3] means they'd take 1, 2, or 3 tickets)
  status: "pending" | "approved" | "denied" | "completed"
  requestedAt: string
  processedAt?: string
  processedBy?: string
  assignedTicketId?: string
}

const REQUESTS_STORAGE_KEY = "ticket_scheduler_requests"

// Get all requests from localStorage
export function getRequests(): TicketRequest[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(REQUESTS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Error reading requests:", error)
  }

  return []
}

// Save requests to localStorage
export function setRequests(requests: TicketRequest[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests))
  } catch (error) {
    console.error("Error saving requests:", error)
  }
}

// Create a new request
export function createRequest(requestData: Omit<TicketRequest, "id" | "status" | "requestedAt">): TicketRequest {
  const newRequest: TicketRequest = {
    ...requestData,
    id: crypto.randomUUID(),
    status: "pending",
    requestedAt: new Date().toISOString(),
  }

  const requests = getRequests()
  const updatedRequests = [...requests, newRequest]
  setRequests(updatedRequests)

  return newRequest
}

// Update request status
export function updateRequestStatus(
  requestId: string,
  status: "approved" | "denied" | "completed",
  processedBy: string,
  assignedTicketId?: string,
): TicketRequest | null {
  const requests = getRequests()
  const requestIndex = requests.findIndex((r) => r.id === requestId)

  if (requestIndex === -1) return null

  const updatedRequest: TicketRequest = {
    ...requests[requestIndex],
    status,
    processedAt: new Date().toISOString(),
    processedBy,
    assignedTicketId,
  }

  requests[requestIndex] = updatedRequest
  setRequests(requests)

  return updatedRequest
}

// Get requests by event ID
export function getRequestsByEventId(eventId: string): TicketRequest[] {
  const requests = getRequests()
  return requests.filter((r) => r.eventId === eventId)
}

// Get requests by user ID
export function getRequestsByUserId(userId: string): TicketRequest[] {
  const requests = getRequests()
  return requests.filter((r) => r.userId === userId)
}

// Get pending requests count for event
export function getPendingRequestsCount(eventId: string): number {
  const requests = getRequests()
  return requests.filter((r) => r.eventId === eventId && r.status === "pending").length
}

// Check if user has already requested for event
export function hasUserRequestedEvent(userId: string, eventId: string): boolean {
  const requests = getRequests()
  return requests.some((r) => r.userId === userId && r.eventId === eventId)
}

// Get request statistics
export function getRequestStats() {
  const requests = getRequests()

  return {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    denied: requests.filter((r) => r.status === "denied").length,
    completed: requests.filter((r) => r.status === "completed").length,
  }
}

export function deleteRequest(requestId: string): boolean {
  const requests = getRequests()
  const filteredRequests = requests.filter((r) => r.id !== requestId)

  if (filteredRequests.length === requests.length) {
    return false // Request not found
  }

  setRequests(filteredRequests)
  return true
}
