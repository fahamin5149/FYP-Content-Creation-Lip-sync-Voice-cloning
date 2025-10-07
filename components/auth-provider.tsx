"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

// NOTE: Firebase removed. This AuthProvider implements a minimal client-side
// auth shim so the UI and routes remain functional until a real backend is
// connected (PostgreSQL planned later).

// Minimal User shape used by the app (subset of Firebase User)
type User = {
  uid: string
  email?: string | null
  emailVerified?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>> // ✅ expose setter
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<User>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, simulate no authenticated user. In a real implementation
  // we'd check cookies/sessions or tokens.
  useEffect(() => {
    setLoading(false)
  }, [])

  // Hardcoded sign-in logic as requested.
  const signIn = async (email: string, password: string) => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 250))

    if (email === "hello@gmail.com" && password === "aminfahim123") {
      const u: User = {
        uid: "local-uid-1",
        email,
        emailVerified: true,
      }
      setUser(u)
      return u as any
    }

    // Keep error messages consistent with previous code paths where possible
    const err: any = new Error("Invalid credentials")
    err.code = "auth/invalid-credential"
    throw err
  }

  // No-op signUp for now; UI will show the success modal without backend integration.
  const signUp = async (email: string, password: string) => {
    // simulate async operation
    await new Promise((r) => setTimeout(r, 250))
    // Intentionally do not create any backend user yet.
    return
  }

  // Google sign-in is not available in this stubbed setup.
  const signInWithGoogle = async () => {
    await new Promise((r) => setTimeout(r, 250))
    const err: any = new Error("Google sign-in is disabled in this build")
    err.code = "auth/google-disabled"
    throw err
  }

  const logout = async () => {
    // Local logout only
    setUser(null)
  }

  const resetPassword = async (email: string) => {
    // Simulate reset email sent. No backend integration for now.
    await new Promise((r) => setTimeout(r, 200))
    return
  }

  const value: AuthContextType = {
    user,
    loading,
    setUser,         // ✅ exposed to consumers
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
