"use client"

import { useState, useEffect } from "react"
import { useWorkspace } from "@/hooks/use-workspace"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DollarSign, Save, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface TicketValue {
  teamId: string
  seatType: string
  value: number
  season: string
}

export function AdminTicketValues() {
  const { workspace, updateWorkspace } = useWorkspace()
  const [editingSeatNames, setEditingSeatNames] = useState<{ [key: string]: string }>({})
  const [newSeatTypes, setNewSeatTypes] = useState<{ [teamId: string]: string }>({})
  const [newSeasonName, setNewSeasonName] = useState("")
  const [showNewSeasonDialog, setShowNewSeasonDialog] = useState(false)
  const [currentSeason, setCurrentSeason] = useState<string>(() => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // JavaScript months are 0-indexed

    // If we're before September, we're still in the previous season
    const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1
    return `${seasonStartYear}-${seasonStartYear + 1}`
  })
  const [ticketValues, setTicketValues] = useState<TicketValue[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!workspace?.ticketValues) {
      setTicketValues([])
      return
    }

    if (Array.isArray(workspace.ticketValues)) {
      setTicketValues(
        workspace.ticketValues.map((tv: any) => ({
          ...tv,
          season: tv.season || currentSeason,
        })),
      )
    } else {
      // Convert old object format to array format
      const values: TicketValue[] = []
      Object.entries(workspace.ticketValues).forEach(([teamId, teamValues]: [string, any]) => {
        Object.entries(teamValues).forEach(([seatType, value]: [string, any]) => {
          values.push({ teamId, seatType, value: Number(value), season: currentSeason })
        })
      })
      setTicketValues(values)
    }
  }, [workspace?.ticketValues])

  const generateSeasonOptions = () => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // JavaScript months are 0-indexed

    // If we're before September, we're still in the previous season
    const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1

    const seasons = []
    for (let i = 0; i < 10; i++) {
      const startYear = seasonStartYear - i
      const endYear = startYear + 1
      seasons.push(`${startYear}-${endYear}`)
    }
    return seasons
  }

  const createNewSeason = () => {
    if (!newSeasonName.trim()) {
      toast.error("Please enter a season name")
      return
    }

    const seasonName = newSeasonName.trim()

    // Check if season already exists
    const existingSeasons = generateSeasonOptions()
    if (existingSeasons.includes(seasonName)) {
      toast.error("Season already exists")
      return
    }

    // Create default ticket values for all teams in the new season
    const newSeasonTickets: TicketValue[] = []

    workspace?.teams
      .filter((team) => team.enabled)
      .forEach((team) => {
        // Get existing seat types from current season or default
        const existingSeatTypes = getSeatTypesForTeamAndSeason(team.id)

        existingSeatTypes.forEach((seatType) => {
          // Get value from current season or default to 0
          const existingValue = getValueForSeat(team.id, seatType) || 0
          newSeasonTickets.push({
            teamId: team.id,
            seatType,
            value: existingValue,
            season: seasonName,
          })
        })
      })

    const updatedTicketValues = [...ticketValues, ...newSeasonTickets]

    const result = updateWorkspace({
      ...workspace!,
      ticketValues: updatedTicketValues,
    })

    if (result) {
      setCurrentSeason(seasonName)
      setNewSeasonName("")
      setShowNewSeasonDialog(false)
      toast.success(`Created new season: ${seasonName}`)
    } else {
      toast.error("Failed to create new season")
    }
  }

  const handleSeatNameChange = (teamId: string, seatType: string, newValue: string) => {
    setEditingSeatNames((prev) => ({
      ...prev,
      [`${teamId}-${seatType}`]: newValue,
    }))
  }

  const handleValueChange = (teamId: string, seatType: string, value: number) => {
    setTicketValues((prev) => {
      const existing = prev.find(
        (tv) => tv.teamId === teamId && tv.seatType === seatType && tv.season === currentSeason,
      )
      if (existing) {
        return prev.map((tv) =>
          tv.teamId === teamId && tv.seatType === seatType && tv.season === currentSeason ? { ...tv, value } : tv,
        )
      } else {
        return [...prev, { teamId, seatType, value, season: currentSeason }]
      }
    })
  }

  const saveTicketValues = () => {
    setIsLoading(true)
    if (workspace) {
      const result = updateWorkspace({
        ...workspace,
        ticketValues,
        currentSeason,
      })

      if (result) {
        toast.success("Ticket values saved successfully!", {
          duration: 3000,
          style: {
            background: "#10B981",
            color: "white",
          },
        })
      } else {
        toast.error("Failed to save ticket values")
      }
    }
    setIsLoading(false)
  }

  const getValueForSeat = (teamId: string, seatType: string) => {
    const ticketValue = ticketValues.find(
      (tv) => tv.teamId === teamId && tv.seatType === seatType && tv.season === currentSeason,
    )
    return ticketValue?.value || 0
  }

  const getSeatTypesForTeamAndSeason = (teamId: string) => {
    const seasonSeatTypes = ticketValues
      .filter((tv) => tv.teamId === teamId && tv.season === currentSeason)
      .map((tv) => tv.seatType)

    // If no seat types exist for this season, initialize with default team seat types
    if (seasonSeatTypes.length === 0) {
      const team = workspace?.teams.find((t) => t.id === teamId)
      if (team) {
        const defaultSeatTypes = team.seatTypes.map((st) => (typeof st === "string" ? st : st?.name || "Unknown"))
        // Create ticket values for default seat types if they don't exist
        const newTicketValues = defaultSeatTypes.map((seatType) => ({
          teamId,
          seatType,
          value: 0,
          season: currentSeason,
        }))
        setTicketValues((prev) => [...prev, ...newTicketValues])
        return defaultSeatTypes
      }
    }

    return [...new Set(seasonSeatTypes)]
  }

  const addSeatType = (teamId: string) => {
    const newSeatType = newSeatTypes[teamId]
    if (!newSeatType?.trim()) return

    setTicketValues((prev) => [...prev, { teamId, seatType: newSeatType.trim(), value: 0, season: currentSeason }])

    setNewSeatTypes((prev) => ({ ...prev, [teamId]: "" }))
  }

  const removeSeatType = (teamId: string, seatType: string) => {
    const updatedValues = ticketValues.filter(
      (tv) => !(tv.teamId === teamId && tv.seatType === seatType && tv.season === currentSeason),
    )

    setTicketValues(updatedValues)

    // Save to workspace immediately
    if (workspace) {
      const result = updateWorkspace({
        ...workspace,
        ticketValues: updatedValues,
      })

      if (result) {
        toast.success("Seat type deleted successfully!")
      } else {
        toast.error("Failed to delete seat type")
      }
    }
  }

  const saveSeatNameChange = (teamId: string, oldSeatType: string) => {
    const newSeatType = editingSeatNames[`${teamId}-${oldSeatType}`]

    if (newSeatType && newSeatType.trim() && newSeatType.trim() !== oldSeatType) {
      const trimmedSeatType = newSeatType.trim()

      const existingSeatType = ticketValues.find(
        (tv) => tv.teamId === teamId && tv.seatType === trimmedSeatType && tv.season === currentSeason,
      )

      if (existingSeatType) {
        toast.error("Seat type already exists")
        setEditingSeatNames((prev) => {
          const updated = { ...prev }
          delete updated[`${teamId}-${oldSeatType}`]
          return updated
        })
        return
      }

      const updatedValues = ticketValues.map((tv) =>
        tv.teamId === teamId && tv.seatType === oldSeatType && tv.season === currentSeason
          ? { ...tv, seatType: trimmedSeatType }
          : tv,
      )

      setTicketValues(updatedValues)

      if (workspace) {
        const result = updateWorkspace({
          ...workspace,
          ticketValues: updatedValues,
        })

        if (result) {
          // The useEffect will automatically sync the state when workspace updates
          toast.success("Seat name updated successfully!")
        } else {
          setTicketValues(ticketValues)
          toast.error("Failed to save seat name")
        }
      }
    }

    // Clear editing state
    setEditingSeatNames((prev) => {
      const updated = { ...prev }
      delete updated[`${teamId}-${oldSeatType}`]
      return updated
    })
  }

  if (!workspace) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Default Ticket Values</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Label htmlFor="season" className="text-sm whitespace-nowrap">
              Season:
            </Label>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Select value={currentSeason} onValueChange={setCurrentSeason}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateSeasonOptions().map((season) => (
                    <SelectItem key={season} value={season}>
                      {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showNewSeasonDialog} onOpenChange={setShowNewSeasonDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
                    <Plus className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">New Season</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Season</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seasonName">Season Name</Label>
                      <Input
                        id="seasonName"
                        placeholder="e.g., 2025-2026 or Custom Season Name"
                        value={newSeasonName}
                        onChange={(e) => setNewSeasonName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            createNewSeason()
                          }
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This will create a new season with default ticket values copied from the current season for all
                      teams.
                    </p>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowNewSeasonDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createNewSeason}>Create Season</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {workspace.teams
          .filter((team) => team.enabled)
          .map((team) => (
            <div key={team.id} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Badge style={{ backgroundColor: team.color }} className="text-white">
                  {team.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentSeason}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getSeatTypesForTeamAndSeason(team.id).map((seatType, index) => {
                  const editKey = `${team.id}-${seatType}`
                  const isEditing = editKey in editingSeatNames

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        {isEditing ? (
                          <div className="flex gap-2 flex-1">
                            <Input
                              value={editingSeatNames[editKey]}
                              onChange={(e) => handleSeatNameChange(team.id, seatType, e.target.value)}
                              onBlur={() => saveSeatNameChange(team.id, seatType)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  saveSeatNameChange(team.id, seatType)
                                }
                                if (e.key === "Escape") {
                                  setEditingSeatNames((prev) => {
                                    const updated = { ...prev }
                                    delete updated[editKey]
                                    return updated
                                  })
                                }
                              }}
                              className="text-sm"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            <Label
                              className="cursor-pointer hover:text-blue-600 flex-1 text-sm"
                              onClick={() =>
                                setEditingSeatNames((prev) => ({
                                  ...prev,
                                  [editKey]: seatType,
                                }))
                              }
                            >
                              {seatType} <span className="text-xs text-muted-foreground">(click to edit)</span>
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSeatType(team.id, seatType)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={getValueForSeat(team.id, seatType)}
                          onChange={(e) => handleValueChange(team.id, seatType, Number(e.target.value))}
                          className="pl-10"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  )
                })}

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Add New Seat Type</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Row 2, SRO"
                      value={newSeatTypes[team.id] || ""}
                      onChange={(e) => setNewSeatTypes((prev) => ({ ...prev, [team.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addSeatType(team.id)
                        }
                      }}
                      className="text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={() => addSeatType(team.id)} className="px-2 shrink-0">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

        <div className="flex justify-end">
          <Button onClick={saveTicketValues} className="flex items-center space-x-2" disabled={isLoading}>
            {isLoading && <span>Loading...</span>}
            {!isLoading && <Save className="w-4 h-4" />}
            {!isLoading && <span>Save Ticket Values</span>}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
