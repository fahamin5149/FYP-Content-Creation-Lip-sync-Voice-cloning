"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { signup, login, googleSignUp, googleSignIn, logout as logoutApi, verifyEmail } from "@/lib/api"

interface AuthResponseData {
  id?: number
  email: string
  message?: string
}

interface AuthContextType {
  signup: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  googleSignUp: (token?: string) => Promise<void>
  googleSignIn: (token: string) => Promise<void>
  logout: () => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  user: { email: string; name?: string } | null
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleSignup = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    try {
      const response: AuthResponseData = await signup(name, email, password)
      setUser({ email: response.email, name: (response as any).name || undefined })
      setIsAuthenticated(true)
    } catch (error: any) {
      throw error
    }
  }, [])

  const handleLogin = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const response: AuthResponseData = await login(email, password)
      setUser({ email: response.email })
      setIsAuthenticated(true)
    } catch (error: any) {
      throw error
    }
  }, [])

  const handleGoogleSignUp = useCallback(async (token?: string): Promise<void> => {
    try {
      // legacy compatibility: if token provided, use googleSignIn
      if (token) {
        const response = await googleSignIn(token)
        setUser({ email: response.email, name: (response as any).name || undefined })
        setIsAuthenticated(true)
        return
      }

      // otherwise call the placeholder endpoint
      const response: AuthResponseData = await googleSignUp()
      setUser({ email: response.email })
      setIsAuthenticated(true)
    } catch (error: any) {
      throw error
    }
  }, [])

  const handleGoogleSignIn = useCallback(async (token: string): Promise<void> => {
    try {
      const response = await googleSignIn(token)
      setUser({ email: response.email, name: (response as any).name || undefined })
      setIsAuthenticated(true)
    } catch (error: any) {
      throw error
    }
  }, [])

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await logoutApi()
      setUser(null)
      setIsAuthenticated(false)
    } catch (error: any) {
      throw error
    }
  }, [])

  const handleVerifyEmail = useCallback(async (token: string): Promise<void> => {
    try {
      await verifyEmail(token)
    } catch (error: any) {
      throw error
    }
  }, [])

  const contextValue: AuthContextType = {
    signup: handleSignup,
    login: handleLogin,
  googleSignUp: handleGoogleSignUp,
  googleSignIn: handleGoogleSignIn,
    logout: handleLogout,
    verifyEmail: handleVerifyEmail,
    user,
    isAuthenticated,
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