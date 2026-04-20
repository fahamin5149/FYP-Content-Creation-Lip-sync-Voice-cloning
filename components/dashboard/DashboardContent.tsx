"use client"

import { useEffect, useState } from "react"
import { getUserProfile } from "@/lib/api"
import { StatsCard } from "./StatsCard"
import {
  Video,
  Mic,
  Clock,
  HardDrive
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface UserProfile {
  id: number
  email: string
  fullName: string
  isEmailVerified: boolean
  createdAt: string
}

const DASHBOARD_STATS = {
  videosGenerated: 8,
  voiceModels: 2,
  processingQueue: 2,
  storageUsed: "2.4 GB"
}

export function DashboardContent() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const profile = await getUserProfile()
        setUser(profile)
      } catch (error) {
        console.error("Failed to load user profile in dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-4 w-64 bg-white/10" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full bg-white/10" />
          <Skeleton className="h-32 w-full bg-white/10" />
          <Skeleton className="h-32 w-full bg-white/10" />
          <Skeleton className="h-32 w-full bg-white/10" />
        </div>
        <Skeleton className="h-6 w-40 bg-white/10" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Welcome back, {user?.fullName || user?.email || "User"}!
        </h1>
        <p className="text-white/80 mt-2 text-lg">
          Here's your content creation overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<Video className="h-6 w-6" />}
          label="Videos Generated"
          value={DASHBOARD_STATS.videosGenerated}
        />
        <StatsCard
          icon={<Mic className="h-6 w-6" />}
          label="Voice Models"
          value={DASHBOARD_STATS.voiceModels}
          subtext="English, Urdu"
        />
        <StatsCard
          icon={<Clock className="h-6 w-6" />}
          label="Processing Queue"
          value={DASHBOARD_STATS.processingQueue}
          subtext="Videos in progress"
        />
        <StatsCard
          icon={<HardDrive className="h-6 w-6" />}
          label="Storage Used"
          value={DASHBOARD_STATS.storageUsed}
          subtext="of 10 GB"
        />
      </div>
    </div>
  )
}
