"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Users, Building } from "lucide-react"

interface BulkAssignmentToolbarProps {
  selectedTickets: string[]
  onBulkAssign: (assignment: {
    assignedTo?: string
    assignedCompany?: string
    assignmentType?: string
    confirmed?: boolean
  }) => void
  onClearSelection: () => void
}

export function BulkAssignmentToolbar({ selectedTickets, onBulkAssign, onClearSelection }: BulkAssignmentToolbarProps) {
  const [bulkName, setBulkName] = useState("")
  const [bulkCompany, setBulkCompany] = useState("")
  const [bulkType, setBulkType] = useState<string>("")

  const handleBulkAssign = () => {
    const assignment: any = {}

    if (bulkName.trim()) assignment.assignedTo = bulkName.trim()
    if (bulkCompany.trim()) assignment.assignedCompany = bulkCompany.trim()
    if (bulkType) {
      assignment.assignmentType = bulkType
      assignment.confirmed = false // Reset confirmation for bulk changes
    }

    onBulkAssign(assignment)

    // Clear form
    setBulkName("")
    setBulkCompany("")
    setBulkType("")
  }

  if (selectedTickets.length === 0) return null

  return (
    <Card className="border-primary bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              {selectedTickets.length} tickets selected
            </Badge>
            <span className="text-sm text-muted-foreground">Bulk Assignment</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Assign to person..."
                value={bulkName}
                onChange={(e) => setBulkName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Company..."
                value={bulkCompany}
                onChange={(e) => setBulkCompany(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-32">
            <Select value={bulkType} onValueChange={setBulkType}>
              <SelectTrigger>
                <SelectValue placeholder="Type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="donated">Donated</SelectItem>
                <SelectItem value="gifted">Gifted</SelectItem>
                <SelectItem value="traded">Traded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleBulkAssign} disabled={!bulkName && !bulkCompany && !bulkType}>
            Apply to Selected
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
