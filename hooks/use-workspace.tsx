"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import {
  type Workspace,
  getWorkspace,
  createFTMWorkspace,
  createCustomWorkspace,
  updateWorkspace,
  migrateWorkspaceToNewSeatNames,
  type SeatType,
} from "@/lib/workspace"

interface WorkspaceContextType {
  workspace: Workspace | null
  isSetup: boolean
  loading: boolean
  createFTM: () => Workspace
  createCustom: (
    organizationName: string,
    selectedTeams: string[],
    customSeatTypes: Record<string, SeatType[]>,
  ) => Workspace
  updateWorkspace: (updates: Partial<Workspace>) => Workspace | null
  refreshWorkspace: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshWorkspace = () => {
    const currentWorkspace = getWorkspace()
    setWorkspaceState(currentWorkspace)
  }

  useEffect(() => {
    refreshWorkspace()
    const currentWorkspace = getWorkspace()
    if (currentWorkspace) {
      migrateWorkspaceToNewSeatNames()
      // Refresh again after migration to get updated data
      refreshWorkspace()
    }
    setLoading(false)
  }, [])

  const createFTM = (): Workspace => {
    const newWorkspace = createFTMWorkspace()
    setWorkspaceState(newWorkspace)
    return newWorkspace
  }

  const createCustom = (
    organizationName: string,
    selectedTeams: string[],
    customSeatTypes: Record<string, SeatType[]>,
  ): Workspace => {
    const newWorkspace = createCustomWorkspace(organizationName, selectedTeams, customSeatTypes)
    setWorkspaceState(newWorkspace)
    return newWorkspace
  }

  const updateWorkspaceData = (updates: Partial<Workspace>): Workspace | null => {
    const updated = updateWorkspace(updates)
    if (updated) {
      setWorkspaceState(updated)
    }
    return updated
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        isSetup: workspace !== null,
        loading,
        createFTM,
        createCustom,
        updateWorkspace: updateWorkspaceData,
        refreshWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
