"use client"

export interface User {
  id: string
  name: string
  email: string
  company: string
  phone: string
  role: "admin" | "user"
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

const AUTH_STORAGE_KEY = "ticket_scheduler_auth"
const USERS_STORAGE_KEY = "ticket_scheduler_users"

const ADMIN_PASSWORD = "Admin87!"
const PUBLIC_PASSWORD = "suite1"

// Get current auth state from localStorage
export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, isAuthenticated: false }
  }

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      const authState = JSON.parse(stored)
      return authState
    }
  } catch (error) {
    console.error("Error reading auth state:", error)
  }

  return { user: null, isAuthenticated: false }
}

// Save auth state to localStorage
export function setAuthState(authState: AuthState): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
  } catch (error) {
    console.error("Error saving auth state:", error)
  }
}

// Get all users from localStorage
export function getUsers(): User[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Error reading users:", error)
  }

  return []
}

// Save users to localStorage
export function setUsers(users: User[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.error("Error saving users:", error)
  }
}

// Register a new user
export function registerUser(
  userData: Omit<User, "id" | "createdAt" | "role">,
  inviteInfo?: {
    workspaceId: string
    organization: string
  },
): User {
  const users = getUsers()

  const role = inviteInfo ? "user" : users.length === 0 ? "admin" : "user"

  const newUser: User = {
    ...userData,
    id: crypto.randomUUID(),
    role,
    createdAt: new Date().toISOString(),
  }

  const updatedUsers = [...users, newUser]
  setUsers(updatedUsers)

  return newUser
}

// Login user
export function loginUser(email: string, password: string): User | null {
  const users = getUsers()

  // Simple password check - in real app would use proper hashing
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

  if (user) {
    const authState: AuthState = {
      user,
      isAuthenticated: true,
    }
    setAuthState(authState)
    return user
  }

  return null
}

// Logout user
export function logoutUser(): void {
  setAuthState({ user: null, isAuthenticated: false })
}

// Find user by email (for password reset)
export function findUserByEmail(email: string): User | null {
  const users = getUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Update user password (simplified for demo)
export function updateUserPassword(email: string, newPassword: string): boolean {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase())

  if (userIndex !== -1) {
    // In real app, would hash the password
    setUsers(users)
    return true
  }

  return false
}

export function getInviteParams(): {
  invite?: string
  email?: string
  workspaceId?: string
  organization?: string
} | null {
  if (typeof window === "undefined") return null

  const urlParams = new URLSearchParams(window.location.search)
  const invite = urlParams.get("invite")
  const email = urlParams.get("email")
  const workspaceId = urlParams.get("workspaceId")
  const organization = urlParams.get("organization")

  if (invite && email && workspaceId) {
    return { invite, email, workspaceId, organization }
  }

  return null
}

// Login with password
export function loginWithPassword(password: string, userType: "admin" | "public"): User | null {
  let isValidPassword = false
  let user: User

  if (userType === "admin" && password === ADMIN_PASSWORD) {
    isValidPassword = true
    user = {
      id: "admin-user",
      name: "Administrator",
      email: "admin@freshtapemedia.com",
      company: "Fresh Tape Media",
      phone: "",
      role: "admin",
      createdAt: new Date().toISOString(),
    }
  } else if (userType === "public" && password === PUBLIC_PASSWORD) {
    isValidPassword = true
    user = {
      id: "public-user-" + Date.now(),
      name: "Public User",
      email: "",
      company: "",
      phone: "",
      role: "user",
      createdAt: new Date().toISOString(),
    }
  } else {
    return null
  }

  if (isValidPassword) {
    const authState: AuthState = {
      user,
      isAuthenticated: true,
    }
    setAuthState(authState)
    return user
  }

  return null
}

// Create session user
export function createSessionUser(profile: { name: string; company?: string; email: string; phone?: string }): User {
  return {
    id: "session-user-" + Date.now(),
    name: profile.name,
    email: profile.email,
    company: profile.company || "",
    phone: profile.phone || "",
    role: "user",
    createdAt: new Date().toISOString(),
  }
}
