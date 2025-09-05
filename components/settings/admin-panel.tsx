"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Shield, Users, Database, Trash2, Download } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  company?: string
  createdAt: string
}

export function AdminPanel() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalTickets: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [])

  const loadUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem("ticket_scheduler_users") || "[]")
    setUsers(storedUsers)
  }

  const loadStats = () => {
    const events = JSON.parse(localStorage.getItem("events") || "[]")
    const users = JSON.parse(localStorage.getItem("ticket_scheduler_users") || "[]")

    let totalTickets = 0
    let totalRevenue = 0

    events.forEach((event: any) => {
      if (event.tickets) {
        totalTickets += event.tickets.length
        event.tickets.forEach((ticket: any) => {
          if (ticket.assignmentType === "sold" && ticket.status === "confirmed" && ticket.price) {
            totalRevenue += ticket.price
          }
        })
      }
    })

    setStats({
      totalUsers: users.length,
      totalEvents: events.length,
      totalTickets,
      totalRevenue,
    })
  }

  const updateUserRole = (userId: string, newRole: string) => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    setUsers(updatedUsers)
    localStorage.setItem("ticket_scheduler_users", JSON.stringify(updatedUsers))
    toast.success("User role updated")
  }

  const deleteUser = (userId: string) => {
    if (userId === user?.id) {
      toast.error("Cannot delete your own account")
      return
    }

    const updatedUsers = users.filter((u) => u.id !== userId)
    setUsers(updatedUsers)
    localStorage.setItem("ticket_scheduler_users", JSON.stringify(updatedUsers))
    toast.success("User deleted")
  }

  const exportToCSV = () => {
    const events = JSON.parse(localStorage.getItem("events") || "[]")
    const people = JSON.parse(localStorage.getItem("people") || "[]")
    const requests = JSON.parse(localStorage.getItem("requests") || "[]")
    const workspace = JSON.parse(localStorage.getItem("workspace") || "{}")

    const allData = []

    // Add events data
    events.forEach((event: any) => {
      event.tickets?.forEach((ticket: any) => {
        allData.push({
          Type: "Event",
          EventName: event.opponent || event.eventName,
          Team: event.team,
          Date: event.date,
          Time: event.time,
          SeatType: ticket.seatType,
          AssignedTo: ticket.assignedTo || "",
          Company: ticket.assignedCompany || "",
          AssignmentType: ticket.assignmentType || "",
          Value: ticket.value || 0,
          Price: ticket.price || 0,
          Status: ticket.status || "",
        })
      })
    })

    // Add people data
    people.forEach((person: any) => {
      allData.push({
        Type: "Person",
        Name: person.name,
        Email: person.email,
        Company: person.company || "",
        CreatedAt: person.createdAt || "",
      })
    })

    // Add requests data
    requests.forEach((request: any) => {
      allData.push({
        Type: "Request",
        EventId: request.eventId,
        RequesterName: request.requesterName,
        RequesterEmail: request.requesterEmail,
        Company: request.company || "",
        Priority: request.priority,
        Status: request.status,
        RequestedQuantities: JSON.stringify(request.requestedQuantities || []),
        CreatedAt: request.createdAt,
      })
    })

    if (allData.length === 0) {
      toast.error("No data to export")
      return
    }

    const headers = Object.keys(allData[0])
    const csvContent = [
      headers.join(","),
      ...allData.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value || ""
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `ticket-scheduler-export-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Data exported successfully")
  }

  const clearAllData = () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL data including:\n\n" +
        "• All events and tickets\n" +
        "• All user assignments\n" +
        "• All ticket requests\n" +
        "• All people records\n" +
        "• All workspace settings\n\n" +
        "This action CANNOT be undone. Are you absolutely sure?",
    )

    if (confirmed) {
      try {
        // Clear all data stores
        localStorage.removeItem("events")
        localStorage.removeItem("assignments")
        localStorage.removeItem("requests")
        localStorage.removeItem("people")
        localStorage.removeItem("workspace")
        localStorage.removeItem("assignment_history")

        // Reset users to just current user
        const currentUser = user
        if (currentUser) {
          localStorage.setItem("ticket_scheduler_users", JSON.stringify([currentUser]))
        } else {
          localStorage.removeItem("ticket_scheduler_users")
        }

        toast.success("All data cleared successfully")

        // Force reload to reset all state
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (error) {
        console.error("Error clearing data:", error)
        toast.error("Error clearing data. Please try again.")
      }
    }
  }

  if (user?.role !== "admin") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Admin access required</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">{stats.totalTickets}</p>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.company || "-"}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(value) => updateUserRole(u.id, value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => deleteUser(u.id)} disabled={u.id === user?.id}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
          <CardDescription>Data management and system actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export to CSV
            </Button>
            <Button variant="destructive" onClick={clearAllData}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
