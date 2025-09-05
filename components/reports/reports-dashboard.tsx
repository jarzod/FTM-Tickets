"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/hooks/use-workspace"
import {
  generateRevenueReport,
  generateAssignmentBreakdown,
  getTopTicketHolders,
  getCompanyAnalytics,
  getEventStatistics,
  getRequestStatistics,
} from "@/lib/analytics"
import { RevenueChart } from "./revenue-chart"
import { AssignmentBreakdownChart } from "./assignment-breakdown-chart"
import { TopTicketHoldersTable } from "./top-ticket-holders-table"
import { CompanyAnalyticsTable } from "./company-analytics-table"
import { Calendar, MessageSquare, DollarSign, Ticket } from "lucide-react"

export function ReportsDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])

  const { workspace } = useWorkspace()
  const enabledTeams = workspace?.teams.filter((team) => team.enabled) || []

  // Generate reports with current filters
  const revenueReport = generateRevenueReport(
    dateRange.startDate || undefined,
    dateRange.endDate || undefined,
    selectedTeams.length > 0 ? selectedTeams : undefined,
  ) || {
    confirmedRevenue: 0,
    pendingRevenue: 0,
    totalTicketsConfirmed: 0,
    totalTicketsSold: 0,
    averageTicketPrice: 0,
    revenueByTeam: [],
    revenueByMonth: [],
  }

  const assignmentBreakdown = generateAssignmentBreakdown(
    dateRange.startDate || undefined,
    dateRange.endDate || undefined,
  ) || {
    sold: { count: 0, percentage: 0 },
    team: { count: 0, percentage: 0 },
    donated: { count: 0, percentage: 0 },
    gifted: { count: 0, percentage: 0 },
    unassigned: { count: 0, percentage: 0 },
  }

  const topTicketHolders = getTopTicketHolders(10) || []
  const companyAnalytics = getCompanyAnalytics() || []
  const eventStats = getEventStatistics() || {
    totalEvents: 0,
    upcomingEvents: 0,
    soldOutEvents: 0,
    playoffEvents: 0,
    totalTickets: 0,
    assignedTickets: 0,
  }
  const requestStats = getRequestStatistics() || {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    deniedRequests: 0,
    approvalRate: 0,
    requestsByPriority: { need: 0, want: 0, "nice-to-have": 0 },
  }

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
  }

  const clearFilters = () => {
    setDateRange({ startDate: "", endDate: "" })
    setSelectedTeams([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights into your ticket sales and business performance</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Customize your reports by date range and teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex-1">
              <Label>Teams</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {enabledTeams.map((team) => (
                  <Button
                    key={team.id}
                    variant={selectedTeams.includes(team.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTeamToggle(team.id)}
                  >
                    <div className={`w-3 h-3 rounded ${team.color} mr-2`} />
                    {team.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueReport.confirmedRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${revenueReport.pendingRevenue.toFixed(2)} pending confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueReport.totalTicketsConfirmed}</div>
            <p className="text-xs text-muted-foreground">
              {revenueReport.totalTicketsSold - revenueReport.totalTicketsConfirmed} pending confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {eventStats.upcomingEvents} upcoming, {eventStats.soldOutEvents} sold out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestStats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {requestStats.pendingRequests} pending, {requestStats.approvalRate.toFixed(1)}% approval rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueReport} />
        <AssignmentBreakdownChart data={assignmentBreakdown} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopTicketHoldersTable data={topTicketHolders} />
        <CompanyAnalyticsTable data={companyAnalytics} />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Sold:</span>
              <span className="font-medium">{assignmentBreakdown.sold.count} tickets</span>
            </div>
            <div className="flex justify-between">
              <span>Team:</span>
              <span className="font-medium">{assignmentBreakdown.team.count} tickets</span>
            </div>
            <div className="flex justify-between">
              <span>Donated:</span>
              <span className="font-medium">{assignmentBreakdown.donated.count} tickets</span>
            </div>
            <div className="flex justify-between">
              <span>Gifted:</span>
              <span className="font-medium">{assignmentBreakdown.gifted.count} tickets</span>
            </div>
            <div className="flex justify-between">
              <span>Available:</span>
              <span className="font-medium">{assignmentBreakdown.unassigned.count} tickets</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>High Priority (Need):</span>
              <span className="font-medium">{requestStats.requestsByPriority.need}</span>
            </div>
            <div className="flex justify-between">
              <span>Medium Priority (Want):</span>
              <span className="font-medium">{requestStats.requestsByPriority.want}</span>
            </div>
            <div className="flex justify-between">
              <span>Low Priority (Nice):</span>
              <span className="font-medium">{requestStats.requestsByPriority["nice-to-have"]}</span>
            </div>
            <div className="flex justify-between">
              <span>Approved:</span>
              <span className="font-medium text-green-600">{requestStats.approvedRequests}</span>
            </div>
            <div className="flex justify-between">
              <span>Denied:</span>
              <span className="font-medium text-red-600">{requestStats.deniedRequests}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Avg Ticket Price:</span>
              <span className="font-medium">${revenueReport.averageTicketPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilization Rate:</span>
              <span className="font-medium">
                {eventStats.totalTickets > 0
                  ? ((eventStats.assignedTickets / eventStats.totalTickets) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sold Out Events:</span>
              <span className="font-medium">{eventStats.soldOutEvents}</span>
            </div>
            <div className="flex justify-between">
              <span>Playoff Events:</span>
              <span className="font-medium">{eventStats.playoffEvents}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Companies:</span>
              <span className="font-medium">{companyAnalytics.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
