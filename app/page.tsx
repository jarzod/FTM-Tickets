"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspace } from "@/hooks/use-workspace"
import { SimplePasswordLogin } from "@/components/auth/simple-password-login"
import { SessionProfileForm } from "@/components/auth/session-profile-form"
import { EventsList } from "@/components/events/events-list"
import { UserRequestsView } from "@/components/requests/user-requests-view"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"
import { SettingsDashboard } from "@/components/settings/settings-dashboard"
import { TicketholdersList } from "@/components/ticketholders/ticketholders-list"
import { Button } from "@/components/ui/button"
import { Ticket, FileText, MessageSquare, Users, ChevronDown, User, Shield, Eye, LogOut } from "lucide-react"
import { TicketholderDropdownItems } from "@/components/ticketholders/ticketholder-dropdown-items"

type MainView = "events" | "reports" | "ticketholders" | "requests" | "settings"

function CustomDropdown({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg border z-20">
            <div className="py-1" onClick={() => setIsOpen(false)}>
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DropdownItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center" onClick={onClick}>
      {children}
    </button>
  )
}

function DropdownSeparator() {
  return <div className="border-t border-gray-200 my-1" />
}

function AuthPage() {
  const [mainView, setMainView] = useState<MainView>("events")
  const [isPublicView, setIsPublicView] = useState(false)
  const [showSessionProfile, setShowSessionProfile] = useState(false)
  const { user, isAuthenticated, logout, userType } = useAuth()
  const { workspace, loading: workspaceLoading } = useWorkspace()

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

  if (isAuthenticated && user && workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Ticket Manager
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600">by Fresh Tape Media</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-center">
                {userType === "admin" && !isPublicView && (
                  <>
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
                  </>
                )}
              </div>

              <CustomDropdown
                trigger={
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 rounded-full px-2 sm:px-4 w-full sm:w-auto justify-start"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left flex-1 sm:flex-initial">
                      <p className="text-sm font-medium">
                        {userType === "public" && user.selectedTicketholder
                          ? user.selectedTicketholder.name
                          : userType === "public"
                            ? "Select Identity"
                            : user.name}
                      </p>
                      <p className="text-xs text-slate-600">{userType === "admin" ? "Administrator" : "Public User"}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                }
              >
                {userType === "public" && (
                  <>
                    <div className="px-4 py-2 text-sm font-medium text-slate-600">Select Identity:</div>
                    <TicketholderDropdownItems />
                    <DropdownSeparator />
                  </>
                )}
                {userType === "admin" && (
                  <DropdownItem onClick={() => setMainView("requests")}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    My Requests
                  </DropdownItem>
                )}
                {userType === "public" && (
                  <DropdownItem onClick={() => setShowSessionProfile(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Update Profile
                  </DropdownItem>
                )}
                {userType === "admin" && (
                  <DropdownItem onClick={() => setMainView("settings")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownItem>
                )}
                {userType === "admin" && (
                  <>
                    <DropdownItem onClick={() => setMainView("settings")}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Settings
                    </DropdownItem>
                    <DropdownItem onClick={() => setIsPublicView(!isPublicView)}>
                      <Eye className="w-4 h-4 mr-2" />
                      {isPublicView ? "Switch to Admin View" : "Switch to Public View"}
                    </DropdownItem>
                  </>
                )}
                <DropdownSeparator />
                <DropdownItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2 text-red-600" />
                  <span className="text-red-600">Sign Out</span>
                </DropdownItem>
              </CustomDropdown>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {userType === "public" || isPublicView ? (
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Available Events
                </h2>
                <EventsList isPublicView={true} />
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <UserRequestsView />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-6">
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
