"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { type Workspace, getWorkspace, createDefaultWorkspace, updateWorkspace } from "@/lib/workspace"

interface WorkspaceContextType {
  workspace: Workspace | null
  isSetup: boolean
  loading: boolean
  updateWorkspace: (updates: Partial<Workspace>) => Workspace | null
  refreshWorkspace: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshWorkspace = () => {
    let currentWorkspace = getWorkspace()
    if (!currentWorkspace) {
      currentWorkspace = createDefaultWorkspace()
    }
    setWorkspaceState(currentWorkspace)
  }

  useEffect(() => {
    refreshWorkspace()
    setLoading(false)
  }, [])

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
        isSetup: true, // Always return true since we auto-create workspace
        loading,
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
