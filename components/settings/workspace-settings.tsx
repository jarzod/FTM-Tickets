"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useWorkspace } from "@/hooks/use-workspace"
import { toast } from "sonner"
import { Palette } from "lucide-react"

export function WorkspaceSettings() {
  const { workspace, updateWorkspace, refreshWorkspace } = useWorkspace()
  const [formData, setFormData] = useState({
    organizationName: workspace?.organizationName || "",
    teams: workspace?.teams || [],
  })

  useEffect(() => {
    if (workspace) {
      setFormData({
        organizationName: workspace.organizationName || "",
        teams: workspace.teams || [],
      })
    }
  }, [workspace])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = updateWorkspace(formData)
    if (result) {
      refreshWorkspace()
      toast.success("Workspace settings updated")
    } else {
      toast.error("Failed to update workspace settings")
    }
  }

  const toggleTeam = (teamId: string) => {
    const updatedFormData = {
      ...formData,
      teams: formData.teams.map((team) => (team.id === teamId ? { ...team, enabled: !team.enabled } : team)),
    }
    setFormData(updatedFormData)

    const result = updateWorkspace(updatedFormData)
    if (result) {
      refreshWorkspace()
    }
  }

  const updateTeamColor = (teamId: string, color: string) => {
    const updatedFormData = {
      ...formData,
      teams: formData.teams.map((team) => (team.id === teamId ? { ...team, color } : team)),
    }
    setFormData(updatedFormData)

    const result = updateWorkspace(updatedFormData)
    if (result) {
      refreshWorkspace()
      toast.success("Team color updated", { duration: 1000 })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Settings</CardTitle>
        <CardDescription>Configure your organization and team settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={formData.organizationName}
              onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Team Configuration</Label>
            {formData.teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={team.color.startsWith("#") ? team.color : "#0e2240"}
                      onChange={(e) => updateTeamColor(team.id, e.target.value)}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                      title="Click to change team color"
                    />
                    <Palette className="absolute -bottom-1 -right-1 w-3 h-3 text-gray-500 pointer-events-none" />
                  </div>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">{team.category}</p>
                  </div>
                </div>
                <Switch checked={team.enabled} onCheckedChange={() => toggleTeam(team.id)} />
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">
            Update Organization Name
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
