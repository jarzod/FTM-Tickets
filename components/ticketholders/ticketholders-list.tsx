"use client"

import { useState, useMemo } from "react"
import { usePeople } from "@/hooks/use-people"
import { useEvents } from "@/hooks/use-events"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspace } from "@/hooks/use-workspace" // Added workspace hook
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, User, UserCheck, DollarSign, Calendar, Plus, Edit, Trash2, Users } from "lucide-react"
import { exportToCSV } from "@/lib/data-export"
import { toast } from "react-toastify"
import { Label } from "@/components/ui/label"

interface TicketholderWithStats {
  id: string
  name: string
  email: string
  company: string
  role: "non-user" | "public" | "admin"
  totalTickets: number
  totalRevenue: number
  lastEvent: string
  ticketHistory: Array<{
    eventId: string
    eventName: string
    date: string
    seatType: string
    assignmentType: string
    price: number
    status: string
  }>
}

export function TicketholdersList() {
  const { people, addOrUpdatePerson, deletePerson, mergePeople } = usePeople()
  const { events } = useEvents()
  const { users, updateUser } = useAuth()
  const { workspace } = useWorkspace() // Added workspace context
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTicketholder, setSelectedTicketholder] = useState<TicketholderWithStats | null>(null)
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [editingTicketholder, setEditingTicketholder] = useState<TicketholderWithStats | null>(null)
  const [deletingTicketholder, setDeletingTicketholder] = useState<TicketholderWithStats | null>(null)
  const [mergingTicketholder, setMergingTicketholder] = useState<TicketholderWithStats | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState("")
  const [editTicketholderData, setEditTicketholderData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  })
  const [newTicketholderData, setNewTicketholderData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  })

  const ticketholders = useMemo(() => {
    const ticketholderMap = new Map<string, TicketholderWithStats>()

    people.forEach((person) => {
      const key = person.name.toLowerCase()
      if (!ticketholderMap.has(key)) {
        const user = users?.find((u) => u.email.toLowerCase() === person.email.toLowerCase())
        let role: "non-user" | "public" | "admin" = "non-user"
        if (user) {
          role = user.isAdmin ? "admin" : "public"
        }

        ticketholderMap.set(key, {
          id: person.id,
          name: person.name,
          email: person.email,
          company: person.company || "",
          role,
          totalTickets: 0,
          totalRevenue: 0,
          lastEvent: "",
          ticketHistory: [],
        })
      }
    })

    events.forEach((event) => {
      event.tickets.forEach((ticket) => {
        if (ticket.assignedTo) {
          const assignedName = ticket.assignedTo
          const key = assignedName.toLowerCase()

          if (!ticketholderMap.has(key)) {
            const user = users?.find((u) => u.name.toLowerCase() === assignedName.toLowerCase())
            let role: "non-user" | "public" | "admin" = "non-user"
            if (user) {
              role = user.isAdmin ? "admin" : "public"
            }

            ticketholderMap.set(key, {
              id: assignedName,
              name: assignedName,
              email: "",
              company: "",
              role,
              totalTickets: 0,
              totalRevenue: 0,
              lastEvent: "",
              ticketHistory: [],
            })
          }

          const ticketholder = ticketholderMap.get(key)!
          ticketholder.totalTickets++

          if (ticket.assignmentType === "sold" && ticket.status === "confirmed") {
            ticketholder.totalRevenue += ticket.price || 0
          }

          ticketholder.lastEvent = event.date
          ticketholder.ticketHistory.push({
            eventId: event.id,
            eventName: `${event.opponent || event.eventName} - ${event.team}`,
            date: event.date,
            seatType: ticket.seatType,
            assignmentType: ticket.assignmentType || "assigned",
            price: ticket.price || 0,
            status: ticket.status || "confirmed",
          })
        }
      })
    })

    return Array.from(ticketholderMap.values()).sort((a, b) => b.totalTickets - a.totalTickets)
  }, [people, events, users])

  const filteredTicketholders = useMemo(() => {
    if (!searchTerm) return ticketholders

    const term = searchTerm.toLowerCase()
    return ticketholders.filter(
      (th) =>
        th.name.toLowerCase().includes(term) ||
        th.email.toLowerCase().includes(term) ||
        th.company.toLowerCase().includes(term),
    )
  }, [ticketholders, searchTerm])

  const generateInvoice = (ticketholder: TicketholderWithStats) => {
    const invoiceData = ticketholder.ticketHistory
      .filter((ticket) => ticket.assignmentType === "sold" && ticket.status === "confirmed")
      .map((ticket) => ({
        Date: ticket.date,
        Event: ticket.eventName,
        "Seat Type": ticket.seatType,
        Price: `$${ticket.price.toFixed(2)}`,
        Status: ticket.status,
      }))

    const totalRevenue = invoiceData.reduce((sum, item) => sum + Number.parseFloat(item.Price.replace("$", "")), 0)

    exportToCSV(
      [
        ...invoiceData,
        {
          Date: "",
          Event: "TOTAL",
          "Seat Type": "",
          Price: `$${totalRevenue.toFixed(2)}`,
          Status: "",
        },
      ],
      `invoice-${ticketholder.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`,
    )
  }

  const handleRoleChange = (ticketholder: TicketholderWithStats, newRole: "non-user" | "public" | "admin") => {
    if (ticketholder.role === "non-user" && newRole !== "non-user") {
      toast.error("User must create an account before role can be changed")
      return
    }

    const user = users?.find(
      (u) =>
        u.name.toLowerCase() === ticketholder.name.toLowerCase() ||
        u.email.toLowerCase() === ticketholder.email.toLowerCase(),
    )

    if (user && newRole !== "non-user") {
      updateUser(user.id, { isAdmin: newRole === "admin" })
      toast.success(`Role updated to ${newRole}`)
    }
  }

  const generateInviteUrl = (ticketholder: TicketholderWithStats) => {
    const params = new URLSearchParams({
      invite: ticketholder.name,
      email: ticketholder.email,
      workspaceId: workspace?.id || "",
      organization: workspace?.organizationName || "",
    })
    const inviteUrl = `${window.location.origin}?${params.toString()}`
    return inviteUrl
  }

  const copyInviteUrl = (ticketholder: TicketholderWithStats) => {
    const inviteUrl = generateInviteUrl(ticketholder)
    navigator.clipboard
      .writeText(inviteUrl)
      .then(() => {
        alert("Invite URL copied to clipboard!")
      })
      .catch(() => {
        prompt("Copy this invite URL:", inviteUrl)
      })
  }

  const generateSelectedInvoice = (ticketholder: TicketholderWithStats) => {
    const selectedTicketData = ticketholder.ticketHistory
      .filter((ticket, index) => selectedTickets.has(`${ticketholder.id}-${index}`))
      .filter((ticket) => ticket.assignmentType === "sold")
      .map((ticket) => ({
        Date: ticket.date,
        Event: ticket.eventName,
        "Seat Type": ticket.seatType,
        Price: `$${ticket.price.toFixed(2)}`,
        Status: ticket.status,
      }))

    if (selectedTicketData.length === 0) {
      toast.error("Please select tickets to include in the invoice")
      return
    }

    const totalRevenue = selectedTicketData.reduce(
      (sum, item) => sum + Number.parseFloat(item.Price.replace("$", "")),
      0,
    )

    exportToCSV(
      [
        ...selectedTicketData,
        {
          Date: "",
          Event: "TOTAL",
          "Seat Type": "",
          Price: `$${totalRevenue.toFixed(2)}`,
          Status: "",
        },
      ],
      `invoice-${ticketholder.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`,
    )

    setSelectedTickets(new Set()) // Clear selection after generating invoice
  }

  const toggleTicketSelection = (ticketholderId: string, ticketIndex: number) => {
    const ticketKey = `${ticketholderId}-${ticketIndex}`
    const newSelection = new Set(selectedTickets)

    if (newSelection.has(ticketKey)) {
      newSelection.delete(ticketKey)
    } else {
      newSelection.add(ticketKey)
    }

    setSelectedTickets(newSelection)
  }

  const createNewTicketholder = () => {
    if (!newTicketholderData.name.trim() || !newTicketholderData.email.trim()) {
      toast.error("Name and email are required")
      return
    }

    try {
      addOrUpdatePerson({
        name: newTicketholderData.name.trim(),
        email: newTicketholderData.email.trim(),
        company: newTicketholderData.company.trim(),
        phone: newTicketholderData.phone.trim(),
      })

      toast.success("Ticketholder created successfully!")
      setShowCreateDialog(false)
      setNewTicketholderData({ name: "", email: "", company: "", phone: "" })
    } catch (error) {
      toast.error("Failed to create ticketholder")
    }
  }

  const updateTicketholder = () => {
    if (!editingTicketholder || !editTicketholderData.name.trim() || !editTicketholderData.email.trim()) {
      toast.error("Name and email are required")
      return
    }

    try {
      addOrUpdatePerson({
        name: editTicketholderData.name.trim(),
        email: editTicketholderData.email.trim(),
        company: editTicketholderData.company.trim(),
        phone: editTicketholderData.phone.trim(),
      })

      toast.success("Ticketholder updated successfully!")
      setShowEditDialog(false)
      setEditingTicketholder(null)
    } catch (error) {
      toast.error("Failed to update ticketholder")
    }
  }

  const deleteTicketholder = () => {
    if (!deletingTicketholder) return

    try {
      const success = deletePerson(deletingTicketholder.id)
      if (success) {
        toast.success(`Ticketholder ${deletingTicketholder.name} deleted successfully!`)
      } else {
        toast.error("Failed to delete ticketholder - not found")
      }
      setShowDeleteDialog(false)
      setDeletingTicketholder(null)
    } catch (error) {
      toast.error("Failed to delete ticketholder")
    }
  }

  const mergeTicketholders = () => {
    if (!mergingTicketholder || !mergeTargetId) return

    const targetTicketholder = ticketholders.find((t) => t.id === mergeTargetId)
    if (!targetTicketholder) {
      toast.error("Target ticketholder not found")
      return
    }

    try {
      const success = mergePeople(mergeTargetId, mergingTicketholder.id)
      if (success) {
        toast.success(`${mergingTicketholder.name} merged into ${targetTicketholder.name} successfully!`)
      } else {
        toast.error("Failed to merge ticketholders - one or both not found")
      }
      setShowMergeDialog(false)
      setMergingTicketholder(null)
      setMergeTargetId("")
    } catch (error) {
      toast.error("Failed to merge ticketholders")
    }
  }

  const openEditDialog = (ticketholder: TicketholderWithStats) => {
    setEditingTicketholder(ticketholder)
    setEditTicketholderData({
      name: ticketholder.name,
      email: ticketholder.email,
      company: ticketholder.company,
      phone: "", // Phone not available in current data structure
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (ticketholder: TicketholderWithStats) => {
    setDeletingTicketholder(ticketholder)
    setShowDeleteDialog(true)
  }

  const openMergeDialog = (ticketholder: TicketholderWithStats) => {
    setMergingTicketholder(ticketholder)
    setShowMergeDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ticketholders</h2>
          <p className="text-muted-foreground">Manage all ticketholders, their roles, and account status</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create New Ticketholder</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Ticketholder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newTicketholderData.name}
                      onChange={(e) => setNewTicketholderData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTicketholderData.email}
                      onChange={(e) => setNewTicketholderData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={newTicketholderData.company}
                      onChange={(e) => setNewTicketholderData((prev) => ({ ...prev, company: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newTicketholderData.phone}
                      onChange={(e) => setNewTicketholderData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewTicketholder}>Create Ticketholder</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Ticketholder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name *</Label>
                    <Input
                      id="edit-name"
                      value={editTicketholderData.name}
                      onChange={(e) => setEditTicketholderData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editTicketholderData.email}
                      onChange={(e) => setEditTicketholderData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-company">Company</Label>
                    <Input
                      id="edit-company"
                      value={editTicketholderData.company}
                      onChange={(e) => setEditTicketholderData((prev) => ({ ...prev, company: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editTicketholderData.phone}
                      onChange={(e) => setEditTicketholderData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateTicketholder}>Update Ticketholder</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Ticketholder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete <strong>{deletingTicketholder?.name}</strong>?
                </p>
                <p className="text-sm text-muted-foreground">
                  This will remove them from the system and all their ticket history. This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={deleteTicketholder}>
                    Delete Ticketholder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Merge Ticketholders</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  Merge <strong>{mergingTicketholder?.name}</strong> into another ticketholder:
                </p>
                <div className="space-y-2">
                  <Label htmlFor="merge-target">Select target ticketholder</Label>
                  <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose target ticketholder..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketholders
                        .filter((t) => t.id !== mergingTicketholder?.id)
                        .map((ticketholder) => (
                          <SelectItem key={ticketholder.id} value={ticketholder.id}>
                            {ticketholder.name} ({ticketholder.totalTickets} tickets)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  All tickets and history from {mergingTicketholder?.name} will be transferred to the selected
                  ticketholder.
                </p>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={mergeTicketholders} disabled={!mergeTargetId}>
                    Merge Ticketholders
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search ticketholders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTicketholders.map((ticketholder) => (
          <Card key={ticketholder.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {ticketholder.role === "admin" ? (
                      <UserCheck className="w-5 h-5 text-blue-600" />
                    ) : ticketholder.role === "public" ? (
                      <UserCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-semibold">{ticketholder.name}</h3>
                      <p className="text-sm text-muted-foreground">{ticketholder.email}</p>
                      {ticketholder.company && <p className="text-sm text-muted-foreground">{ticketholder.company}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select
                      value={ticketholder.role}
                      onValueChange={(value: "non-user" | "public" | "admin") => handleRoleChange(ticketholder, value)}
                      disabled={ticketholder.role === "non-user" && ticketholder.email === ""}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-user">Non-user</SelectItem>
                        {ticketholder.role !== "non-user" && (
                          <>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(ticketholder)}
                      className="text-xs flex items-center space-x-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMergeDialog(ticketholder)}
                      className="text-xs flex items-center space-x-1"
                    >
                      <Users className="w-3 h-3" />
                      <span>Merge</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(ticketholder)}
                      className="text-xs flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{ticketholder.totalTickets}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Tickets</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">${ticketholder.totalRevenue.toFixed(0)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedTicketholder(ticketholder)}>
                          View History
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Ticket History - {ticketholder.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Tickets: {ticketholder.totalTickets} | Total Revenue: $
                                {ticketholder.totalRevenue.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => generateSelectedInvoice(ticketholder)}
                                size="sm"
                                className="flex items-center space-x-2"
                                disabled={selectedTickets.size === 0}
                              >
                                <FileText className="w-4 h-4" />
                                <span>Generate Invoice ({selectedTickets.size})</span>
                              </Button>
                              <Button onClick={() => setSelectedTickets(new Set())} size="sm" variant="outline">
                                Clear Selection
                              </Button>
                            </div>
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">Select</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Seat Type</TableHead>
                                <TableHead>Assignment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Price</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                const now = new Date()
                                const futureTickets = ticketholder.ticketHistory.filter(
                                  (ticket) => new Date(ticket.date) >= now,
                                )
                                const pastTickets = ticketholder.ticketHistory.filter(
                                  (ticket) => new Date(ticket.date) < now,
                                )

                                return (
                                  <>
                                    {futureTickets.length > 0 && (
                                      <>
                                        <TableRow>
                                          <TableCell colSpan={7} className="font-semibold bg-blue-50 text-blue-900">
                                            Future Tickets ({futureTickets.length})
                                          </TableCell>
                                        </TableRow>
                                        {futureTickets
                                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                          .map((ticket, index) => {
                                            const ticketKey = `${ticketholder.id}-${index}`
                                            return (
                                              <TableRow key={`future-${index}`}>
                                                <TableCell>
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedTickets.has(ticketKey)}
                                                    onChange={() => toggleTicketSelection(ticketholder.id, index)}
                                                    className="rounded"
                                                  />
                                                </TableCell>
                                                <TableCell>{new Date(ticket.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{ticket.eventName}</TableCell>
                                                <TableCell>{ticket.seatType}</TableCell>
                                                <TableCell>
                                                  <Badge
                                                    variant={ticket.assignmentType === "sold" ? "default" : "secondary"}
                                                  >
                                                    {ticket.assignmentType}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>
                                                  <Badge
                                                    variant={
                                                      ticket.status === "confirmed"
                                                        ? "default"
                                                        : ticket.status === "tentative"
                                                          ? "secondary"
                                                          : "outline"
                                                    }
                                                  >
                                                    {ticket.status}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>${ticket.price.toFixed(2)}</TableCell>
                                              </TableRow>
                                            )
                                          })}
                                      </>
                                    )}
                                    {pastTickets.length > 0 && (
                                      <>
                                        <TableRow>
                                          <TableCell colSpan={7} className="font-semibold bg-gray-50 text-gray-900">
                                            Past Tickets ({pastTickets.length})
                                          </TableCell>
                                        </TableRow>
                                        {pastTickets
                                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                          .map((ticket, index) => {
                                            const ticketKey = `${ticketholder.id}-${index}`
                                            return (
                                              <TableRow key={`past-${index}`} className="opacity-75">
                                                <TableCell>
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedTickets.has(ticketKey)}
                                                    onChange={() => toggleTicketSelection(ticketholder.id, index)}
                                                    className="rounded"
                                                  />
                                                </TableCell>
                                                <TableCell>{new Date(ticket.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{ticket.eventName}</TableCell>
                                                <TableCell>{ticket.seatType}</TableCell>
                                                <TableCell>
                                                  <Badge
                                                    variant={ticket.assignmentType === "sold" ? "default" : "secondary"}
                                                  >
                                                    {ticket.assignmentType}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>
                                                  <Badge
                                                    variant={
                                                      ticket.status === "confirmed"
                                                        ? "default"
                                                        : ticket.status === "tentative"
                                                          ? "secondary"
                                                          : "outline"
                                                    }
                                                  >
                                                    {ticket.status}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>${ticket.price.toFixed(2)}</TableCell>
                                              </TableRow>
                                            )
                                          })}
                                      </>
                                    )}
                                  </>
                                )
                              })()}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTicketholders.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ticketholders found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms." : "Assign tickets to people to see them here."}
          </p>
        </div>
      )}
    </div>
  )
}
