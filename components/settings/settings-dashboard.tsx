"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfileSettings } from "./user-profile-settings"
import { WorkspaceSettings } from "./workspace-settings"
import { DataManagement } from "./data-management"
import { AdminPanel } from "./admin-panel"
import { AdminTicketValues } from "./admin-ticket-values"
import { useAuth } from "@/hooks/use-auth"
import { User, Building, Database, Shield, DollarSign } from "lucide-react"

export function SettingsDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, workspace, and system preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className={`grid w-full ${user?.role === "admin" ? "grid-cols-5" : "grid-cols-3"}`}>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="workspace" className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Workspace</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Data</span>
          </TabsTrigger>
          {user?.role === "admin" && (
            <>
              <TabsTrigger value="ticket-values" className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Ticket Values</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile">
          <UserProfileSettings />
        </TabsContent>

        <TabsContent value="workspace">
          <WorkspaceSettings />
        </TabsContent>

        <TabsContent value="data">
          <DataManagement />
        </TabsContent>

        {user?.role === "admin" && (
          <>
            <TabsContent value="ticket-values">
              <AdminTicketValues />
            </TabsContent>
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
