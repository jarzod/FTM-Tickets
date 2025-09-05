"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exportToCSV, exportAllData } from "@/lib/data-export"
import { toast } from "sonner"
import { Download, FileText } from "lucide-react"

export function DataManagement() {
  const handleExportAll = () => {
    const data = exportAllData()

    // Export each data type separately
    if (data.events.length > 0) {
      exportToCSV(data.events, "events.csv")
    }
    if (data.people.length > 0) {
      exportToCSV(data.people, "people.csv")
    }
    if (data.assignments.length > 0) {
      exportToCSV(data.assignments, "assignments.csv")
    }
    if (data.requests.length > 0) {
      exportToCSV(data.requests, "requests.csv")
    }

    toast.success("Data exported successfully")
  }

  const downloadTemplate = (type: string) => {
    const templates = {
      people: [{ name: "John Doe", email: "john@example.com", company: "Example Corp" }],
      events: [
        {
          title: "Sample Event",
          date: "2024-01-15",
          time: "19:00",
          team: "denver-nuggets",
          basePrice: 150,
        },
      ],
    }

    exportToCSV(templates[type as keyof typeof templates], `${type}-template.csv`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Export your ticket data for backup or migration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Export Data</h3>
          <Button onClick={handleExportAll} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
        </div>

        {/* Templates Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Download Templates</h3>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => downloadTemplate("people")}>
              <FileText className="w-4 h-4 mr-2" />
              People Template
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate("events")}>
              <FileText className="w-4 h-4 mr-2" />
              Events Template
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
