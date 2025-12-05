"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { useUser, useClerk } from "@clerk/nextjs"

interface AuthContextType {
  user: {
    email: string
    name?: string
  } | null
  isAuthenticated: boolean
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut()
    } catch (error: any) {
      throw new Error(error.message || "Failed to logout")
    }
  }

  const contextValue: AuthContextType = {
    user: user
      ? {
          email: user.primaryEmailAddress?.emailAddress || "",
          name: user.firstName || undefined,
        }
      : null,
    isAuthenticated: !!user,
    logout: handleLogout,
    isLoading: !isLoaded,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}