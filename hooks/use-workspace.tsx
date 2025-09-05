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
  createFTM: () => Promise<Workspace>
  createCustom: (
    organizationName: string,
    selectedTeams: string[],
    customSeatTypes: Record<string, SeatType[]>,
  ) => Promise<Workspace>
  updateWorkspace: (updates: Partial<Workspace>) => Promise<Workspace | null>
  refreshWorkspace: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshWorkspace = async () => {
    try {
      const currentWorkspace = getWorkspace()

      if (currentWorkspace) {
        try {
          const response = await fetch(`/api/workspace?password=default-password`)
          const { workspace: dbWorkspace } = await response.json()

          if (!dbWorkspace) {
            // Create workspace in database if it doesn't exist
            await fetch("/api/workspace", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create",
                id: currentWorkspace.id,
                name: currentWorkspace.name,
                password: "default-password",
              }),
            })
          }
        } catch (error) {
          console.log("[v0] Database sync failed, using localStorage:", error)
        }
      }

      setWorkspaceState(currentWorkspace)
    } catch (error) {
      console.error("[v0] Error refreshing workspace:", error)
      setWorkspaceState(null)
    }
  }

  useEffect(() => {
    const initializeWorkspace = async () => {
      await refreshWorkspace()
      const currentWorkspace = getWorkspace()
      if (currentWorkspace) {
        migrateWorkspaceToNewSeatNames()
        await refreshWorkspace()
      }
      setLoading(false)
    }

    initializeWorkspace()
  }, [])

  const createFTM = async (): Promise<Workspace> => {
    const newWorkspace = createFTMWorkspace()

    try {
      await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          id: newWorkspace.id,
          name: newWorkspace.name,
          password: "default-password",
        }),
      })
    } catch (error) {
      console.log("[v0] Database save failed for FTM workspace:", error)
    }

    setWorkspaceState(newWorkspace)
    return newWorkspace
  }

  const createCustom = async (
    organizationName: string,
    selectedTeams: string[],
    customSeatTypes: Record<string, SeatType[]>,
  ): Promise<Workspace> => {
    const newWorkspace = createCustomWorkspace(organizationName, selectedTeams, customSeatTypes)

    try {
      await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          id: newWorkspace.id,
          name: newWorkspace.organizationName,
          password: "default-password",
        }),
      })
    } catch (error) {
      console.log("[v0] Database save failed for custom workspace:", error)
    }

    setWorkspaceState(newWorkspace)
    return newWorkspace
  }

  const updateWorkspaceData = async (updates: Partial<Workspace>): Promise<Workspace | null> => {
    const updated = updateWorkspace(updates)
    if (updated) {
      try {
        await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            id: updated.id,
            updates: { name: updated.name },
          }),
        })
      } catch (error) {
        console.log("[v0] Database update failed:", error)
      }

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
