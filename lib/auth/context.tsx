"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiClient } from "@/lib/api-client"
import type { User, UserRole, AuthResponse } from "@/lib/types"
import { toast } from "sonner"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  hasRole: (roles: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user for development (backend-dependent)
const mockUsers: Record<string, User> = {
  "admin@exam.com": {
    id: "1",
    email: "admin@exam.com",
    fullNameEn: "Admin User",
    fullNameAr: "مستخدم مسؤول",
    role: "Admin" as UserRole,
    isActive: true,
    createdDate: new Date().toISOString(),
  },
  "instructor@exam.com": {
    id: "2",
    email: "instructor@exam.com",
    fullNameEn: "Instructor User",
    fullNameAr: "مستخدم معلم",
    role: "Instructor" as UserRole,
    isActive: true,
    createdDate: new Date().toISOString(),
  },
  "candidate@exam.com": {
    id: "3",
    email: "candidate@exam.com",
    fullNameEn: "Candidate User",
    fullNameAr: "مستخدم مرشح",
    role: "Candidate" as UserRole,
    isActive: true,
    createdDate: new Date().toISOString(),
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = apiClient.getToken()
    const savedUser = localStorage.getItem("user")

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        apiClient.clearToken()
        localStorage.removeItem("user")
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      // Try real API first
      const response = await apiClient.post<AuthResponse>("/api/Auth/login", { email, password })

      if (response.success && response.data) {
        apiClient.setToken(response.data.token)
        setUser(response.data.user)
        localStorage.setItem("user", JSON.stringify(response.data.user))
        toast.success("Login successful")
        return true
      }

      throw new Error(response.message || "Login failed")
    } catch {
      // Fallback to mock data for development (backend-dependent)
      console.warn("[Auth] Using mock login - backend-dependent")

      const mockUser = mockUsers[email]
      if (mockUser && password === "password123") {
        const mockToken = `mock-token-${Date.now()}`
        apiClient.setToken(mockToken)
        setUser(mockUser)
        localStorage.setItem("user", JSON.stringify(mockUser))
        toast.success("Login successful (mock mode)")
        setIsLoading(false)
        return true
      }

      toast.error("Invalid credentials")
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    apiClient.clearToken()
    localStorage.removeItem("user")
    setUser(null)
    toast.success("Logged out successfully")
  }

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasRole }}>
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
