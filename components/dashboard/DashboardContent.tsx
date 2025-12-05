"use client"

import { useEffect, useState } from "react"
import { getUserProfile } from "@/lib/api"
import { StatsCard } from "./StatsCard"
import { VideoCard } from "./VideoCard"
import {
  Video,
  Mic,
  Clock,
  HardDrive
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full bg-white/10" />
          <Skeleton className="h-48 w-full bg-white/10" />
          <Skeleton className="h-48 w-full bg-white/10" />
        </div>
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

      {/* Recent Videos */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Recent Videos</h2>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                className="text-sm px-4 py-2 rounded-lg bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 transition-colors cursor-not-allowed opacity-60"
                disabled
              >
                View All
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-black/90 border-white/20">
              <p className="text-white">Coming Soon</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Replace HARDCODED_VIDEOS with actual dynamic content later */}
          <VideoCard
            video={{
              id: 0,
              title: "Content Coming Soon",
              duration: "--:--",
              language: "N/A",
              status: "completed",
              date: "N/A",
              thumbnailColor: "bg-muted/20"
            }}
          />
        </div>
      </div>
    </div>
  )
}
