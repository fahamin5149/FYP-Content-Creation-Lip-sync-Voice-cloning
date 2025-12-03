// app/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUserProfile } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

interface UserProfile {
  id: number
  email: string
  fullName: string
  isEmailVerified: boolean
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const profile = await getUserProfile()
      
      if (!profile) {
        router.push("/")
        return
      }

      setUser(profile)
    } catch (error) {
      console.error("Authentication error:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking auth - KEEP BACKGROUND CONSISTENT
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-white/80">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  return <DashboardLayout />
}