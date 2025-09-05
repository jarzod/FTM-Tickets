import { getEvents } from "./events"
import { getPeople } from "./people"
import { getRequests } from "./requests"

export interface RevenueReport {
  totalRevenue: number
  confirmedRevenue: number
  pendingRevenue: number
  totalTicketsSold: number
  totalTicketsConfirmed: number
  averageTicketPrice: number
  revenueByMonth: Array<{ month: string; revenue: number; tickets: number }>
  revenueByTeam: Array<{ teamId: string; teamName: string; revenue: number; tickets: number }>
}

export interface AssignmentBreakdown {
  sold: { count: number; percentage: number; revenue: number }
  team: { count: number; percentage: number }
  donated: { count: number; percentage: number }
  gifted: { count: number; percentage: number }
  traded: { count: number; percentage: number }
  unassigned: { count: number; percentage: number }
}

export interface TopTicketHolder {
  name: string
  company: string
  totalAssignments: number
  confirmedRevenue: number
  lastEventDate: string
}

export interface CompanyAnalytics {
  company: string
  totalAssignments: number
  confirmedRevenue: number
  uniqueAttendees: number
  averageSpendPerPerson: number
}

export interface EventStatistics {
  totalEvents: number
  upcomingEvents: number
  pastEvents: number
  playoffEvents: number
  totalTickets: number
  assignedTickets: number
  availableTickets: number
  soldOutEvents: number
}

export interface RequestStatistics {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  deniedRequests: number
  approvalRate: number
  requestsByPriority: {
    want: number
    need: number
    "nice-to-have": number
  }
}

// Generate revenue report with date filtering
export function generateRevenueReport(startDate?: string, endDate?: string, teamIds?: string[]): RevenueReport {
  const events = getEvents() || []
  const filteredEvents = events.filter((event) => {
    if (startDate && event.date < startDate) return false
    if (endDate && event.date > endDate) return false
    if (teamIds && teamIds.length > 0 && !teamIds.includes(event.teamId)) return false
    return true
  })

  let totalRevenue = 0
  let confirmedRevenue = 0
  let pendingRevenue = 0
  let totalTicketsSold = 0
  let totalTicketsConfirmed = 0

  const revenueByMonth: Record<string, { revenue: number; tickets: number }> = {}
  const revenueByTeam: Record<string, { revenue: number; tickets: number; teamName: string }> = {}

  filteredEvents.forEach((event) => {
    if (!event || !event.tickets || !Array.isArray(event.tickets)) return

    const monthKey = event.date?.substring(0, 7) || new Date().toISOString().substring(0, 7)

    event.tickets.forEach((ticket) => {
      if (!ticket) return

      if (ticket.assignmentType === "sold" && ticket.assignedTo) {
        totalTicketsSold++
        const ticketPrice = ticket.price || 0
        totalRevenue += ticketPrice

        if (ticket.status === "confirmed") {
          totalTicketsConfirmed++
          confirmedRevenue += ticketPrice
        } else {
          pendingRevenue += ticketPrice
        }

        // Group by month - only confirmed revenue
        if (!revenueByMonth[monthKey]) {
          revenueByMonth[monthKey] = { revenue: 0, tickets: 0 }
        }
        if (ticket.status === "confirmed") {
          revenueByMonth[monthKey].revenue += ticketPrice
          revenueByMonth[monthKey].tickets += 1
        }

        // Group by team - only confirmed revenue
        const teamId = event.teamId || "unknown"
        if (!revenueByTeam[teamId]) {
          revenueByTeam[teamId] = { revenue: 0, tickets: 0, teamName: teamId }
        }
        if (ticket.status === "confirmed") {
          revenueByTeam[teamId].revenue += ticketPrice
          revenueByTeam[teamId].tickets += 1
        }
      }
    })
  })

  const averageTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0

  return {
    totalRevenue,
    confirmedRevenue,
    pendingRevenue,
    totalTicketsSold,
    totalTicketsConfirmed,
    averageTicketPrice,
    revenueByMonth: Object.entries(revenueByMonth)
      .map(([month, data]) => ({ month: month || "Unknown", ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    revenueByTeam: Object.entries(revenueByTeam).map(([teamId, data]) => ({
      teamId: teamId || "unknown",
      teamName: data.teamName || "Unknown Team",
      revenue: data.revenue || 0,
      tickets: data.tickets || 0,
    })),
  }
}

// Generate assignment breakdown
export function generateAssignmentBreakdown(startDate?: string, endDate?: string): AssignmentBreakdown {
  const events = getEvents() || []
  const filteredEvents = events.filter((event) => {
    if (!event) return false
    if (startDate && event.date < startDate) return false
    if (endDate && event.date > endDate) return false
    return true
  })

  const breakdown = {
    sold: { count: 0, revenue: 0 },
    team: { count: 0 },
    donated: { count: 0 },
    gifted: { count: 0 },
    traded: { count: 0 },
    unassigned: { count: 0 },
  }

  let totalTickets = 0

  filteredEvents.forEach((event) => {
    if (!event || !event.tickets || !Array.isArray(event.tickets)) return

    event.tickets.forEach((ticket) => {
      if (!ticket) return

      totalTickets++
      if (ticket.assignedTo) {
        const assignmentType = ticket.assignmentType
        if (assignmentType && breakdown[assignmentType] && typeof breakdown[assignmentType] === "object") {
          breakdown[assignmentType].count++

          if (assignmentType === "sold" && ticket.status === "confirmed") {
            breakdown.sold.revenue += ticket.price || 0
          }
        }
      } else {
        breakdown.unassigned.count++
      }
    })
  })

  return {
    sold: {
      count: breakdown.sold.count,
      percentage: totalTickets > 0 ? (breakdown.sold.count / totalTickets) * 100 : 0,
      revenue: breakdown.sold.revenue,
    },
    team: {
      count: breakdown.team.count,
      percentage: totalTickets > 0 ? (breakdown.team.count / totalTickets) * 100 : 0,
    },
    donated: {
      count: breakdown.donated.count,
      percentage: totalTickets > 0 ? (breakdown.donated.count / totalTickets) * 100 : 0,
    },
    gifted: {
      count: breakdown.gifted.count,
      percentage: totalTickets > 0 ? (breakdown.gifted.count / totalTickets) * 100 : 0,
    },
    traded: {
      count: breakdown.traded.count,
      percentage: totalTickets > 0 ? (breakdown.traded.count / totalTickets) * 100 : 0,
    },
    unassigned: {
      count: breakdown.unassigned.count,
      percentage: totalTickets > 0 ? (breakdown.unassigned.count / totalTickets) * 100 : 0,
    },
  }
}

// Get top ticket holders
export function getTopTicketHolders(limit = 10): TopTicketHolder[] {
  const people = getPeople()
  const events = getEvents()
  const eventIds = new Set(events.map((e) => e.id))

  return people
    .map((person) => {
      const validHistory = person.assignmentHistory.filter((h) => eventIds.has(h.eventId))

      const confirmedRevenue = validHistory
        .filter((h) => h.assignmentType === "sold" && h.status === "confirmed")
        .reduce((sum, h) => sum + h.price, 0)

      const lastEventDate =
        validHistory.length > 0 ? validHistory.sort((a, b) => b.date.localeCompare(a.date))[0].date : ""

      return {
        name: person.name,
        company: person.company,
        totalAssignments: validHistory.length,
        confirmedRevenue,
        lastEventDate,
      }
    })
    .filter((holder) => holder.totalAssignments > 0) // Only include people with valid assignments
    .sort((a, b) => b.totalAssignments - a.totalAssignments)
    .slice(0, limit)
}

// Get company analytics
export function getCompanyAnalytics(): CompanyAnalytics[] {
  const people = getPeople()
  const events = getEvents()
  const eventIds = new Set(events.map((e) => e.id))
  const companyMap: Record<string, CompanyAnalytics> = {}

  people.forEach((person) => {
    const validHistory = person.assignmentHistory.filter((h) => eventIds.has(h.eventId))

    if (validHistory.length === 0) return // Skip people with no valid assignments

    if (!companyMap[person.company]) {
      companyMap[person.company] = {
        company: person.company,
        totalAssignments: 0,
        confirmedRevenue: 0,
        uniqueAttendees: 0,
        averageSpendPerPerson: 0,
      }
    }

    const company = companyMap[person.company]
    company.uniqueAttendees++
    company.totalAssignments += validHistory.length
    company.confirmedRevenue += validHistory
      .filter((h) => h.assignmentType === "sold" && h.status === "confirmed")
      .reduce((sum, h) => sum + h.price, 0)
  })

  return Object.values(companyMap)
    .map((company) => ({
      ...company,
      averageSpendPerPerson: company.uniqueAttendees > 0 ? company.confirmedRevenue / company.uniqueAttendees : 0,
    }))
    .sort((a, b) => b.confirmedRevenue - a.confirmedRevenue)
}

// Get event statistics
export function getEventStatistics(): EventStatistics {
  const events = getEvents()
  const now = new Date()

  let totalTickets = 0
  let assignedTickets = 0
  let soldOutEvents = 0

  events.forEach((event) => {
    const eventTickets = event.tickets.length
    const eventAssigned = event.tickets.filter((t) => t.assignedTo).length

    totalTickets += eventTickets
    assignedTickets += eventAssigned

    if (eventAssigned === eventTickets) {
      soldOutEvents++
    }
  })

  return {
    totalEvents: events.length,
    upcomingEvents: events.filter((e) => new Date(e.date) >= now).length,
    pastEvents: events.filter((e) => new Date(e.date) < now).length,
    playoffEvents: events.filter((e) => e.isPlayoff).length,
    totalTickets,
    assignedTickets,
    availableTickets: totalTickets - assignedTickets,
    soldOutEvents,
  }
}

// Get request statistics
export function getRequestStatistics(): RequestStatistics {
  const requests = getRequests()
  const events = getEvents()
  const existingEventIds = new Set(events.map((e) => e.id))
  const validRequests = requests.filter((r) => existingEventIds.has(r.eventId))

  const totalRequests = validRequests.length
  const pendingRequests = validRequests.filter((r) => r.status === "pending").length
  const approvedRequests = validRequests.filter((r) => r.status === "approved").length
  const deniedRequests = validRequests.filter((r) => r.status === "denied").length

  const approvalRate = totalRequests > 0 ? (approvedRequests / (approvedRequests + deniedRequests)) * 100 : 0

  const requestsByPriority = {
    want: validRequests.filter((r) => r.priority === "want").length,
    need: validRequests.filter((r) => r.priority === "need").length,
    "nice-to-have": validRequests.filter((r) => r.priority === "nice-to-have").length,
  }

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    deniedRequests,
    approvalRate,
    requestsByPriority,
  }
}
