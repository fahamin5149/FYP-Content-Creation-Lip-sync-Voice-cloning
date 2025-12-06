// app/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { VideoCard } from "@/components/dashboard/VideoCard"
import { Video, FileText, Clock, Sparkles, Play, Edit } from "lucide-react"
import { getUserDrafts } from "@/lib/api"

// Dummy data for generated videos
const dummyVideos = [
  {
    id: 1,
    title: "Introduction to AI Content Creation",
    duration: "2:45",
    language: "English",
    status: "completed" as const,
    date: "2024-03-15",
    thumbnailColor: "bg-gradient-to-br from-purple-500/20 to-blue-500/20"
  },
  {
    id: 2,
    title: "اردو میں مواد تخلیق کی گائیڈ",
    duration: "3:20",
    language: "Urdu",
    status: "completed" as const,
    date: "2024-03-14",
    thumbnailColor: "bg-gradient-to-br from-pink-500/20 to-orange-500/20"
  },
  {
    id: 3,
    title: "Voice Cloning Tutorial",
    duration: "1:30",
    language: "English",
    status: "processing" as const,
    date: "2024-03-13",
    thumbnailColor: "bg-gradient-to-br from-green-500/20 to-teal-500/20",
    progress: 65,
    processingStage: "Lip-sync generation"
  }
]

interface Draft {
  script_id: string
  title: string
  content: string
  language: string
  method: string
  parameters?: any
  updated_at: string
  created_at: string
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loadingDrafts, setLoadingDrafts] = useState(true)

  useEffect(() => {
    if (isSignedIn) {
      fetchDrafts()
    }
  }, [isSignedIn])

  const fetchDrafts = async () => {
    try {
      setLoadingDrafts(true)
      const result = await getUserDrafts(getToken)
      setDrafts(result.drafts || [])
    } catch (error) {
      console.error('Error fetching drafts:', error)
    } finally {
      setLoadingDrafts(false)
    }
  }

  const getStageFromMethod = (method: string, parameters?: any): string => {
    if (method === 'generated') {
      return 'Script Generation'
    } else if (method === 'refinement') {
      if (parameters?.refinementType === 'custom') {
        return 'Custom Refinement'
      }
      return 'Script Refinement'
    }
    return 'Script Review'
  }

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return diffMins <= 1 ? 'just now' : `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    } else {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
    }
  }

  const getTitleFromContent = (content: string): string => {
    // Get first line or first 50 characters as title
    const firstLine = content.split('\n')[0]
    const title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
    return title || 'Untitled Draft'
  }

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-white/80">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Clerk middleware will handle redirects, but show nothing if not signed in
  if (!isSignedIn) {
    return null
  }

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/5 to-transparent p-8 shadow-xl backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-white/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Welcome back</p>
            <h1 className="text-3xl font-bold text-white">Your creator cockpit</h1>
            <p className="mt-2 text-white/70 max-w-2xl">
              Kick off a new script, polish an existing draft, or jump into your media library. The full pipeline lives here.
            </p>
          </div>
          <Link href="/dashboard/create-content" className="inline-flex">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-lg shadow-primary/30 hover:scale-[1.01] transition-transform">
              Create Content
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <StatsCard
          icon={<Video className="h-5 w-5" />}
          label="Total Videos"
          value={12}
          subtext="+3 this week"
        />
        <StatsCard
          icon={<FileText className="h-5 w-5" />}
          label="Saved Drafts"
          value={drafts.length}
          subtext="Ready to continue"
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          label="Watch Time"
          value="24m"
          subtext="Total duration"
        />
        <StatsCard
          icon={<Sparkles className="h-5 w-5" />}
          label="AI Credits"
          value={850}
          subtext="Available"
        />
      </div>

      {/* Saved Drafts Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Saved Drafts</h2>
            <p className="text-sm text-white/60 mt-1">Continue where you left off</p>
          </div>
          <Link href="/dashboard/create-content">
            <button className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-all">
              View All
            </button>
          </Link>
        </div>
        
        {loadingDrafts ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <FileText className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No drafts yet</h3>
            <p className="text-white/60 mb-6">Start creating content and save your progress</p>
            <Link href="/dashboard/create-content">
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-lg shadow-primary/30 hover:scale-[1.01] transition-transform">
                Create Your First Draft
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft) => (
              <Link key={draft.script_id} href={`/dashboard/create-content?draftId=${draft.script_id}`}>
                <div className="group p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                      <Edit className="h-5 w-5" />
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-white/70">
                      {draft.language}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 truncate">
                    {draft.title || getTitleFromContent(draft.content)}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-white/70">
                        {getStageFromMethod(draft.method, draft.parameters)}
                      </span>
                    </div>
                    <p className="text-xs text-white/50">
                      Last edited {getTimeAgo(draft.updated_at)}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-sm text-primary font-medium group-hover:underline">
                      Continue editing →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Generated Videos Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Recent Videos</h2>
            <p className="text-sm text-white/60 mt-1">Your generated content</p>
          </div>
          <button className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-all">
            View All
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dummyVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6 backdrop-blur-sm hover:scale-[1.01] transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
          <div className="relative">
            <Play className="h-8 w-8 text-purple-400 mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Start Creating</h3>
            <p className="text-white/70 mb-4">Generate your next AI-powered video with voice cloning and lip-sync.</p>
            <Link href="/dashboard/create-content">
              <button className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
                Get Started
              </button>
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-pink-500/10 to-orange-500/10 p-6 backdrop-blur-sm hover:scale-[1.01] transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent"></div>
          <div className="relative">
            <Sparkles className="h-8 w-8 text-pink-400 mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Need Help?</h3>
            <p className="text-white/70 mb-4">Check out our tutorials and documentation to master content creation.</p>
            <button className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
              View Tutorials
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}