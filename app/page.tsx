"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspace } from "@/hooks/use-workspace"
import { SimplePasswordLogin } from "@/components/auth/simple-password-login"
import { SessionProfileForm } from "@/components/auth/session-profile-form"
import { WorkspaceSetupWizard } from "@/components/workspace/workspace-setup-wizard"
import { EventsList } from "@/components/events/events-list"
import { UserRequestsView } from "@/components/requests/user-requests-view"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"
import { SettingsDashboard } from "@/components/settings/settings-dashboard"
import { TicketholdersList } from "@/components/ticketholders/ticketholders-list"
import { Button } from "@/components/ui/button"
import { Ticket, FileText, Users, ChevronDown, User, Shield, Eye, LogOut } from "lucide-react"
import { TicketholderDropdownItems } from "@/components/ticketholders/ticketholder-dropdown-items"

type MainView = "events" | "reports" | "ticketholders" | "requests" | "settings"

function AuthPage() {
  const [mainView, setMainView] = useState<MainView>("events")
  const [isPublicView, setIsPublicView] = useState(false)
  const [showSessionProfile, setShowSessionProfile] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, isAuthenticated, logout, userType } = useAuth()
  const { workspace, isSetup, loading: workspaceLoading } = useWorkspace()

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && userType === "public" && showSessionProfile) {
    return <SessionProfileForm onComplete={() => setShowSessionProfile(false)} />
  }

  if (isAuthenticated && user && !isSetup) {
    return <WorkspaceSetupWizard />
  }

  if (isAuthenticated && user && isSetup && workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                    Ticket Manager
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">by Fresh Tape Media</p>
                </div>
              </div>

              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                {userType === "admin" && !isPublicView && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={mainView === "events" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMainView("events")}
                      className="flex items-center space-x-2 rounded-full text-xs sm:text-sm"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Events</span>
                    </Button>
                    <Button
                      variant={mainView === "ticketholders" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMainView("ticketholders")}
                      className="flex items-center space-x-2 rounded-full text-xs sm:text-sm"
                    >
                      <Users className="w-4 h-4" />
                      <span>Ticketholders</span>
                    </Button>
                    <Button
                      variant={mainView === "reports" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMainView("reports")}
                      className="flex items-center space-x-2 rounded-full text-xs sm:text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Reports</span>
                    </Button>
                  </div>
                )}

                <div className="relative">
                  <details className="group">
                    <summary className="flex items-center space-x-2 rounded-full px-3 py-2 min-w-0 cursor-pointer hover:bg-slate-100 list-none">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left min-w-0 hidden sm:block">
                        <p className="text-sm font-medium truncate">
                          {userType === "public" && user.selectedTicketholder
                            ? user.selectedTicketholder.name
                            : userType === "public"
                              ? "Select Identity"
                              : user.name}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {userType === "admin" ? "Administrator" : "Public User"}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                    </summary>

                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-50">
                      <div className="py-1">
                        {userType === "public" && (
                          <>
                            <div className="px-4 py-2 text-sm font-medium text-slate-600 border-b">
                              Select Identity:
                            </div>
                            <TicketholderDropdownItems />
                            <hr className="my-1" />
                          </>
                        )}
                        {userType === "admin" && (
                          <>
                            <button
                              onClick={() => setMainView("settings")}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Admin Settings
                            </button>
                            <button
                              onClick={() => setIsPublicView(!isPublicView)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {isPublicView ? "Switch to Admin View" : "Switch to Public View"}
                            </button>
                          </>
                        )}
                        {userType === "public" && (
                          <button
                            onClick={() => setShowSessionProfile(true)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Update Profile
                          </button>
                        )}
                        <hr className="my-1" />
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center text-red-600"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {userType === "public" || isPublicView ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Available Events
                </h2>
                <EventsList isPublicView={true} />
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <UserRequestsView />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              {mainView === "events" && <EventsList />}
              {mainView === "ticketholders" && <TicketholdersList />}
              {mainView === "reports" && userType === "admin" && <ReportsDashboard />}
              {mainView === "requests" && <UserRequestsView />}
              {mainView === "settings" && <SettingsDashboard />}
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SimplePasswordLogin />
      </div>
    </div>
  )
}

export default function HomePage() {
  return <AuthPage />
}
