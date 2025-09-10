"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

const signIn = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)

    if (!result.user.emailVerified) {
      await signOut(auth) // ensure session is cleared
      setUser(null)
      throw new Error("EmailUnverified")
    }

    return result.user
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new Error("UserNotFound")
    }
    if (error.code === "auth/wrong-password") {
      throw new Error("WrongPassword")
    }
    if (error.code === "auth/invalid-email") {
      throw new Error("InvalidEmail")
    }
    throw error // rethrow for any other case
  }
}

  const signUp = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await sendEmailVerification(result.user)
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null) // ✅ clear user state after sign out
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
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
