"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { api } from "@/lib/api"

interface AuthResponse {
  id?: number
  email: string
  message?: string
}

interface AuthContextType {
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  user: { email: string; name?: string } | null
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      // console.log("AuthProvider signup called with", email, password)
      const response = await api.auth.signup({ email, password }) as AuthResponse
      setUser({ email: response.email })
      setIsAuthenticated(true)
    } catch (error: any) {
      throw error
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.auth.login({ email, password }) as AuthResponse
      setUser({ email: response.email })
      setIsAuthenticated(true)
    } catch (error: any) {
      throw error
    }
  }, [])

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    try {
      const response = await api.auth.googleSignUp() as AuthResponse
      setUser({ email: response.email })
      setIsAuthenticated(true)
    } catch (error: any) {
      throw error
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.auth.logout()
      setUser(null)
      setIsAuthenticated(false)
    } catch (error: any) {
      throw error
    }
  }, [])

  return (
    <AuthContext.Provider value={{ signUp, signIn, signInWithGoogle, logout, user, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}