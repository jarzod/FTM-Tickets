"use client"

export interface SeatType {
  id: string
  name: string
  description?: string
}

export interface Team {
  id: string
  name: string
  sport: string
  color: string
  enabled: boolean
  seatTypes: SeatType[]
}

export interface TicketValue {
  teamId: string
  seatType: string
  value: number
  season?: string
}

export interface Workspace {
  id: string
  name: string
  organizationName: string
  type: "ftm" | "custom"
  teams: Team[]
  ticketValues?: TicketValue[]
  createdAt: string
  updatedAt: string
}

const WORKSPACE_STORAGE_KEY = "ticket_scheduler_workspace"

// Default team configurations
export const DEFAULT_TEAMS: Omit<Team, "enabled">[] = [
  {
    id: "nuggets",
    name: "Denver Nuggets",
    sport: "NBA",
    color: "#0e2240", // Updated Nuggets color to requested hex value
    seatTypes: [
      { id: "suite-row2-seat3", name: "Suite 1, Row 2, Seat 3" },
      { id: "suite-row2-seat4", name: "Suite 1, Row 2, Seat 4" },
      { id: "suite-row3-seat1", name: "Suite 1, Row 3, Seat 1" },
      { id: "suite-row3-seat2", name: "Suite 1, Row 3, Seat 2" },
      { id: "sec-124-seat15", name: "Section 124, Row 1, Seat 15" },
      { id: "sec-124-seat16", name: "Section 124, Row 1, Seat 16" },
    ],
  },
  {
    id: "avalanche",
    name: "Colorado Avalanche",
    sport: "NHL",
    color: "#6f263d", // Updated to use hex color instead of CSS class
    seatTypes: [
      { id: "suite-row2-seat3", name: "Suite 1, Row 2, Seat 3" },
      { id: "suite-row2-seat4", name: "Suite 1, Row 2, Seat 4" },
      { id: "suite-row3-seat1", name: "Suite 1, Row 3, Seat 1" },
      { id: "suite-row3-seat2", name: "Suite 1, Row 3, Seat 2" },
    ],
  },
  {
    id: "broncos",
    name: "Denver Broncos",
    sport: "NFL",
    color: "#fb4f14", // Updated to use hex color instead of CSS class
    seatTypes: [
      { id: "sec-105-seat7", name: "Section 105, Row 8, Seat 7" },
      { id: "sec-105-seat8", name: "Section 105, Row 8, Seat 8" },
      { id: "sec-105-seat9", name: "Section 105, Row 8, Seat 9" },
      { id: "sec-105-seat10", name: "Section 105, Row 8, Seat 10" },
      { id: "sec-313-seat7", name: "Section 313, Row 7, Seat 7" },
      { id: "sec-313-seat8", name: "Section 313, Row 7, Seat 8" },
      { id: "sec-313-seat9", name: "Section 313, Row 7, Seat 9" },
      { id: "sec-313-seat10", name: "Section 313, Row 7, Seat 10" },
    ],
  },
  {
    id: "concerts",
    name: "Concerts & Events",
    sport: "Entertainment",
    color: "#2563eb", // Updated to use hex color instead of CSS class
    seatTypes: [
      { id: "suite-row2-seat3", name: "Suite 1, Row 2, Seat 3" },
      { id: "suite-row2-seat4", name: "Suite 1, Row 2, Seat 4" },
      { id: "suite-row3-seat1", name: "Suite 1, Row 3, Seat 1" },
      { id: "suite-row3-seat2", name: "Suite 1, Row 3, Seat 2" },
    ],
  },
]

// Get current workspace from localStorage
export function getWorkspace(): Workspace | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Error reading workspace:", error)
  }

  return null
}

// Save workspace to localStorage
export function setWorkspace(workspace: Workspace): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace))
  } catch (error) {
    console.error("Error saving workspace:", error)
  }
}

// Create FTM workspace
export function createFTMWorkspace(): Workspace {
  const workspace: Workspace = {
    id: crypto.randomUUID(),
    name: "FTM Workspace",
    organizationName: "FTM Ticket Management",
    type: "ftm",
    teams: DEFAULT_TEAMS.map((team) => ({ ...team, enabled: true })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  setWorkspace(workspace)
  initializeDefaultTicketValues()
  return workspace
}

// Create custom workspace
export function createCustomWorkspace(
  organizationName: string,
  selectedTeams: string[],
  customSeatTypes: Record<string, SeatType[]>,
): Workspace {
  const workspace: Workspace = {
    id: crypto.randomUUID(),
    name: "Custom Workspace",
    organizationName,
    type: "custom",
    teams: DEFAULT_TEAMS.map((team) => ({
      ...team,
      enabled: selectedTeams.includes(team.id),
      seatTypes: customSeatTypes[team.id] || team.seatTypes,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  setWorkspace(workspace)
  initializeDefaultTicketValues()
  return workspace
}

// Update workspace
export function updateWorkspaceData(updates: Partial<Workspace>): Workspace | null {
  const currentWorkspace = getWorkspace()
  if (!currentWorkspace) return null

  const updatedWorkspace: Workspace = {
    ...currentWorkspace,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  setWorkspace(updatedWorkspace)
  return updatedWorkspace
}

export const updateWorkspace = updateWorkspaceData

// Check if workspace is set up
export function isWorkspaceSetup(): boolean {
  return getWorkspace() !== null
}

// Migration function to update existing workspaces with new seat names and values
export function migrateWorkspaceToNewSeatNames(): void {
  const workspace = getWorkspace()
  if (!workspace) return

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1
  const currentSeason = `${seasonStartYear}-${seasonStartYear + 1}`

  // Update teams with new seat types
  const updatedTeams = workspace.teams.map((team) => {
    const defaultTeam = DEFAULT_TEAMS.find((dt) => dt.id === team.id)
    if (defaultTeam) {
      return {
        ...team,
        seatTypes: defaultTeam.seatTypes,
      }
    }
    return team
  })

  const newTicketValues: TicketValue[] = [
    // Colorado Avalanche
    { teamId: "avalanche", seatType: "Suite 1, Row 2, Seat 3", value: 350, season: currentSeason },
    { teamId: "avalanche", seatType: "Suite 1, Row 2, Seat 4", value: 350, season: currentSeason },
    { teamId: "avalanche", seatType: "Suite 1, Row 3, Seat 1", value: 260, season: currentSeason },
    { teamId: "avalanche", seatType: "Suite 1, Row 3, Seat 2", value: 260, season: currentSeason },

    // Concerts & Events
    { teamId: "concerts", seatType: "Suite 1, Row 2, Seat 3", value: 350, season: currentSeason },
    { teamId: "concerts", seatType: "Suite 1, Row 2, Seat 4", value: 350, season: currentSeason },
    { teamId: "concerts", seatType: "Suite 1, Row 3, Seat 1", value: 260, season: currentSeason },
    { teamId: "concerts", seatType: "Suite 1, Row 3, Seat 2", value: 260, season: currentSeason },

    // Denver Nuggets
    { teamId: "nuggets", seatType: "Suite 1, Row 2, Seat 3", value: 350, season: currentSeason },
    { teamId: "nuggets", seatType: "Suite 1, Row 2, Seat 4", value: 350, season: currentSeason },
    { teamId: "nuggets", seatType: "Suite 1, Row 3, Seat 1", value: 260, season: currentSeason },
    { teamId: "nuggets", seatType: "Suite 1, Row 3, Seat 2", value: 260, season: currentSeason },
    { teamId: "nuggets", seatType: "Section 124, Row 1, Seat 15", value: 0, season: currentSeason },
    { teamId: "nuggets", seatType: "Section 124, Row 1, Seat 16", value: 0, season: currentSeason },

    // Denver Broncos
    { teamId: "broncos", seatType: "Section 105, Row 8, Seat 7", value: 300, season: currentSeason },
    { teamId: "broncos", seatType: "Section 105, Row 8, Seat 8", value: 300, season: currentSeason },
    { teamId: "broncos", seatType: "Section 105, Row 8, Seat 9", value: 300, season: currentSeason },
    { teamId: "broncos", seatType: "Section 105, Row 8, Seat 10", value: 300, season: currentSeason },
    { teamId: "broncos", seatType: "Section 313, Row 7, Seat 7", value: 354, season: currentSeason },
    { teamId: "broncos", seatType: "Section 313, Row 7, Seat 8", value: 354, season: currentSeason },
    { teamId: "broncos", seatType: "Section 313, Row 7, Seat 9", value: 354, season: currentSeason },
    { teamId: "broncos", seatType: "Section 313, Row 7, Seat 10", value: 354, season: currentSeason },
  ]

  // Update workspace with new teams and ticket values
  updateWorkspaceData({
    teams: updatedTeams,
    ticketValues: newTicketValues,
  })
}

// Initialize default ticket values
export function initializeDefaultTicketValues(): void {
  const workspace = getWorkspace()
  if (!workspace) return

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1
  const currentSeason = `${seasonStartYear}-${seasonStartYear + 1}`

  const defaultTicketValues: TicketValue[] = [
    // Colorado Avalanche
    { teamId: "avalanche", seatType: "Suite 1, Row 2, Seat 3", value: 350 },
    { teamId: "avalanche", seatType: "Suite 1, Row 2, Seat 4", value: 350 },
    { teamId: "avalanche", seatType: "Suite 1, Row 3, Seat 1", value: 260 },
    { teamId: "avalanche", seatType: "Suite 1, Row 3, Seat 2", value: 260 },

    // Concerts & Events
    { teamId: "concerts", seatType: "Suite 1, Row 2, Seat 3", value: 350 },
    { teamId: "concerts", seatType: "Suite 1, Row 2, Seat 4", value: 350 },
    { teamId: "concerts", seatType: "Suite 1, Row 3, Seat 1", value: 260 },
    { teamId: "concerts", seatType: "Suite 1, Row 3, Seat 2", value: 260 },

    // Denver Nuggets
    { teamId: "nuggets", seatType: "Suite 1, Row 2, Seat 3", value: 350 },
    { teamId: "nuggets", seatType: "Suite 1, Row 2, Seat 4", value: 350 },
    { teamId: "nuggets", seatType: "Suite 1, Row 3, Seat 1", value: 260 },
    { teamId: "nuggets", seatType: "Suite 1, Row 3, Seat 2", value: 260 },
    { teamId: "nuggets", seatType: "Section 124, Row 1, Seat 15", value: 0 },
    { teamId: "nuggets", seatType: "Section 124, Row 1, Seat 16", value: 0 },

    // Denver Broncos
    { teamId: "broncos", seatType: "Section 105, Row 8, Seat 7", value: 300 },
    { teamId: "broncos", seatType: "Section 105, Row 8, Seat 8", value: 300 },
    { teamId: "broncos", seatType: "Section 105, Row 8, Seat 9", value: 300 },
    { teamId: "broncos", seatType: "Section 105, Row 8, Seat 10", value: 300 },
    { teamId: "broncos", seatType: "Section 313, Row 7, Seat 7", value: 354 },
    { teamId: "broncos", seatType: "Section 313, Row 7, Seat 8", value: 354 },
    { teamId: "broncos", seatType: "Section 313, Row 7, Seat 9", value: 354 },
    { teamId: "broncos", seatType: "Section 313, Row 7, Seat 10", value: 354 },
  ]

  // Add season to each ticket value
  const seasonTicketValues = defaultTicketValues.map((tv) => ({
    ...tv,
    season: currentSeason,
  }))

  // Update workspace with default ticket values if none exist
  const existingTicketValues = workspace.ticketValues || []
  const hasExistingValues = Array.isArray(existingTicketValues) && existingTicketValues.length > 0

  if (!hasExistingValues) {
    updateWorkspaceData({
      ticketValues: seasonTicketValues,
    })
  }
}
