"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { type User, type AuthState, getAuthState, setAuthState, loginWithPassword, logoutUser } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  userType: "admin" | "public" | null
  selectedTicketholderId: string | null
  loginAdmin: (password: string) => Promise<boolean>
  loginPublic: (password: string) => Promise<boolean>
  setSessionProfile: (profile: { name: string; company?: string; email: string; phone?: string }) => void
  setSelectedTicketholder: (ticketholder: {
    id: string
    name: string
    email: string
    company?: string
    phone?: string
  }) => void
  updateUser: (userData: Partial<User>) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthStateLocal] = useState<AuthState>({ user: null, isAuthenticated: false })
  const [selectedTicketholderId, setSelectedTicketholderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentAuthState = getAuthState()
    setAuthStateLocal(currentAuthState)
    const savedTicketholderId = localStorage.getItem("selectedTicketholderId")
    if (savedTicketholderId) {
      setSelectedTicketholderId(savedTicketholderId)
    }
    setLoading(false)
  }, [])

  const loginAdmin = async (password: string): Promise<boolean> => {
    const user = loginWithPassword(password, "admin")
    if (user) {
      const newAuthState = { user, isAuthenticated: true }
      setAuthStateLocal(newAuthState)
      return true
    }
    return false
  }

  const loginPublic = async (password: string): Promise<boolean> => {
    const user = loginWithPassword(password, "public")
    if (user) {
      const newAuthState = { user, isAuthenticated: true }
      setAuthStateLocal(newAuthState)
      return true
    }
    return false
  }

  const setSessionProfile = (profile: { name: string; company?: string; email: string; phone?: string }) => {
    if (authState.user && authState.user.role === "user") {
      const updatedUser = { ...authState.user, ...profile }
      const newAuthState = { user: updatedUser, isAuthenticated: true }
      setAuthStateLocal(newAuthState)
      setAuthState(newAuthState)

      const ticketholderIdFromEmail = profile.email // Assuming email is unique identifier
      setSelectedTicketholderId(ticketholderIdFromEmail)
      localStorage.setItem("selectedTicketholderId", ticketholderIdFromEmail)
    }
  }

  const setSelectedTicketholder = (ticketholder: {
    id: string
    name: string
    email: string
    company?: string
    phone?: string
  }) => {
    if (authState.user && authState.user.role === "user") {
      const updatedUser = {
        ...authState.user,
        selectedTicketholder: ticketholder,
        name: ticketholder.name,
        email: ticketholder.email,
        company: ticketholder.company || "",
        phone: ticketholder.phone || "",
      }
      const newAuthState = { user: updatedUser, isAuthenticated: true }
      setAuthStateLocal(newAuthState)
      setAuthState(newAuthState)

      setSelectedTicketholderId(ticketholder.id)
      localStorage.setItem("selectedTicketholderId", ticketholder.id)
      localStorage.setItem("selectedTicketholderData", JSON.stringify(ticketholder))
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...userData }
      const newAuthState = { user: updatedUser, isAuthenticated: true }
      setAuthStateLocal(newAuthState)
      setAuthState(newAuthState)
    }
  }

  const logout = () => {
    logoutUser()
    setAuthStateLocal({ user: null, isAuthenticated: false })
    setSelectedTicketholderId(null)
    localStorage.removeItem("selectedTicketholderId")
    localStorage.removeItem("selectedTicketholderData")
  }

  const userType = authState.user?.role === "admin" ? "admin" : authState.user?.role === "user" ? "public" : null

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
        userType,
        selectedTicketholderId,
        loginAdmin,
        loginPublic,
        setSessionProfile,
        setSelectedTicketholder,
        updateUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
