"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWorkspace } from "@/hooks/use-workspace"
import { DEFAULT_TEAMS, type SeatType } from "@/lib/workspace"
import { CheckCircle, Building2, Users, Settings } from "lucide-react"

type SetupStep = "type" | "organization" | "teams" | "seats" | "complete"

export function WorkspaceSetupWizard() {
  const [currentStep, setCurrentStep] = useState<SetupStep>("type")
  const [workspaceType, setWorkspaceType] = useState<"ftm" | "custom" | null>(null)
  const [organizationName, setOrganizationName] = useState("")
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [customSeatTypes, setCustomSeatTypes] = useState<Record<string, SeatType[]>>({})
  const [error, setError] = useState("")

  const { createFTM, createCustom } = useWorkspace()

  const handleTypeSelection = (type: "ftm" | "custom") => {
    setWorkspaceType(type)
    if (type === "ftm") {
      // Skip to completion for FTM workspace
      createFTM()
      setCurrentStep("complete")
    } else {
      setCurrentStep("organization")
    }
  }

  const handleOrganizationNext = () => {
    if (!organizationName.trim()) {
      setError("Organization name is required")
      return
    }
    setError("")
    setCurrentStep("teams")
  }

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
  }

  const handleTeamsNext = () => {
    if (selectedTeams.length === 0) {
      setError("Please select at least one team")
      return
    }
    setError("")

    // Initialize custom seat types for selected teams
    const initialSeatTypes: Record<string, SeatType[]> = {}
    selectedTeams.forEach((teamId) => {
      const team = DEFAULT_TEAMS.find((t) => t.id === teamId)
      if (team) {
        initialSeatTypes[teamId] = [...team.seatTypes]
      }
    })
    setCustomSeatTypes(initialSeatTypes)
    setCurrentStep("seats")
  }

  const handleSeatTypeChange = (teamId: string, seatIndex: number, field: keyof SeatType, value: string) => {
    setCustomSeatTypes((prev) => ({
      ...prev,
      [teamId]: prev[teamId].map((seat, index) => (index === seatIndex ? { ...seat, [field]: value } : seat)),
    }))
  }

  const addSeatType = (teamId: string) => {
    setCustomSeatTypes((prev) => ({
      ...prev,
      [teamId]: [...prev[teamId], { id: crypto.randomUUID(), name: `New Seat ${prev[teamId].length + 1}` }],
    }))
  }

  const removeSeatType = (teamId: string, seatIndex: number) => {
    setCustomSeatTypes((prev) => ({
      ...prev,
      [teamId]: prev[teamId].filter((_, index) => index !== seatIndex),
    }))
  }

  const handleComplete = () => {
    if (workspaceType === "custom") {
      createCustom(organizationName, selectedTeams, customSeatTypes)
    }
    setCurrentStep("complete")
  }

  const getStepIcon = (step: SetupStep) => {
    switch (step) {
      case "type":
      case "organization":
        return <Building2 className="h-5 w-5" />
      case "teams":
        return <Users className="h-5 w-5" />
      case "seats":
        return <Settings className="h-5 w-5" />
      case "complete":
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const steps = [
    { id: "type", title: "Workspace Type", description: "Choose your setup" },
    { id: "organization", title: "Organization", description: "Enter details" },
    { id: "teams", title: "Teams", description: "Select teams" },
    { id: "seats", title: "Seat Types", description: "Configure seats" },
    { id: "complete", title: "Complete", description: "All done!" },
  ]

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-semibold">Setup Complete!</CardTitle>
            <CardDescription>Your workspace has been configured successfully</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              You can now start managing events and tickets in your workspace.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStepIndex
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {index < currentStepIndex ? <CheckCircle className="h-5 w-5" /> : getStepIcon(step.id as SetupStep)}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 mx-2 ${index < currentStepIndex ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold">{steps[currentStepIndex]?.title}</h2>
            <p className="text-muted-foreground">{steps[currentStepIndex]?.description}</p>
          </div>
        </div>

        {/* Step Content */}
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentStep === "type" && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Choose Your Workspace Type</h3>
                  <p className="text-muted-foreground">Select the setup that best fits your needs</p>
                </div>

                <div className="grid gap-4">
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                    onClick={() => handleTypeSelection("ftm")}
                  >
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-2">FTM Workspace</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Pre-configured professional setup with all teams enabled and optimized seat configurations.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">All Teams Enabled</Badge>
                        <Badge variant="secondary">Professional Setup</Badge>
                        <Badge variant="secondary">Quick Start</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                    onClick={() => handleTypeSelection("custom")}
                  >
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-2">Custom Workspace</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Fully customizable setup where you can choose teams, configure seat types, and set your
                        organization details.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Custom Teams</Badge>
                        <Badge variant="secondary">Flexible Setup</Badge>
                        <Badge variant="secondary">Full Control</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {currentStep === "organization" && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Organization Details</h3>
                  <p className="text-muted-foreground">Enter your organization information</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Enter your organization name"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setCurrentStep("type")}>
                    Back
                  </Button>
                  <Button onClick={handleOrganizationNext}>Next</Button>
                </div>
              </div>
            )}

            {currentStep === "teams" && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Select Teams</h3>
                  <p className="text-muted-foreground">Choose which teams you want to manage</p>
                </div>

                <div className="grid gap-4">
                  {DEFAULT_TEAMS.map((team) => (
                    <Card key={team.id} className="cursor-pointer" onClick={() => handleTeamToggle(team.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedTeams.includes(team.id)}
                            onChange={() => handleTeamToggle(team.id)}
                          />
                          <div className={`w-4 h-4 rounded ${team.color}`} />
                          <div className="flex-1">
                            <h4 className="font-medium">{team.name}</h4>
                            <p className="text-sm text-muted-foreground">{team.sport}</p>
                          </div>
                          <Badge variant="outline">{team.seatTypes.length} seats</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setCurrentStep("organization")}>
                    Back
                  </Button>
                  <Button onClick={handleTeamsNext}>Next</Button>
                </div>
              </div>
            )}

            {currentStep === "seats" && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Configure Seat Types</h3>
                  <p className="text-muted-foreground">Customize seat types for each selected team</p>
                </div>

                {selectedTeams.map((teamId) => {
                  const team = DEFAULT_TEAMS.find((t) => t.id === teamId)
                  if (!team) return null

                  return (
                    <Card key={teamId}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${team.color}`} />
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {customSeatTypes[teamId]?.map((seat, index) => (
                          <div key={seat.id} className="flex items-center space-x-2">
                            <Input
                              value={seat.name}
                              onChange={(e) => handleSeatTypeChange(teamId, index, "name", e.target.value)}
                              placeholder="Seat name"
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSeatType(teamId, index)}
                              disabled={customSeatTypes[teamId].length <= 1}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addSeatType(teamId)} className="w-full">
                          Add Seat Type
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setCurrentStep("teams")}>
                    Back
                  </Button>
                  <Button onClick={handleComplete}>Complete Setup</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
