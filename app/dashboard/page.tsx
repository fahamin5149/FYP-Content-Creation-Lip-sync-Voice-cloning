// app/dashboard/page.tsx
"use client"

import { useCallback, useEffect, useState } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { GeneratedVideoCard } from "@/components/dashboard/GeneratedVideoCard"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clapperboard,
  FileText,
  Mic,
  Edit,
  Video,
  Trash2,
} from "lucide-react"
import {
  getUserDrafts,
  getLipSyncOutputs,
  getUserVideo,
  getUserAudio,
  deleteDraft,
  syncUserToBackend,
  type LipSyncOutputItem,
} from "@/lib/api"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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

interface DashboardStats {
  lipSyncVideos: number
  voiceSamples: number
  faceVideos: number
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loadingDrafts, setLoadingDrafts] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [recentGenerated, setRecentGenerated] = useState<LipSyncOutputItem[]>([])
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null)
  const [deletingDraft, setDeletingDraft] = useState(false)

  const loadDashboard = useCallback(async () => {
    if (!isSignedIn) return
    setLoadingDrafts(true)
    setLoadingStats(true)
    const [draftsResult, lipSyncResult, videoResResult, enAudioResult, urAudioResult] = await Promise.allSettled([
      getUserDrafts(getToken),
      getLipSyncOutputs(getToken),
      getUserVideo(getToken),
      getUserAudio("english", getToken),
      getUserAudio("urdu", getToken),
    ])

    if (draftsResult.status === "fulfilled") {
      setDrafts(draftsResult.value.drafts || [])
    } else {
      console.error("Error loading drafts:", draftsResult.reason)
      setDrafts([])
    }
    setLoadingDrafts(false)

    const lipSync = lipSyncResult.status === "fulfilled" ? lipSyncResult.value : []
    const videoRes =
      videoResResult.status === "fulfilled" ? videoResResult.value : ({ success: false as const, data: [] as any[] })
    const enAudio =
      enAudioResult.status === "fulfilled" ? enAudioResult.value : ({ success: false as const, data: [] as any[] })
    const urAudio =
      urAudioResult.status === "fulfilled" ? urAudioResult.value : ({ success: false as const, data: [] as any[] })

    if (lipSyncResult.status === "rejected") console.error("Error loading generated videos:", lipSyncResult.reason)
    if (videoResResult.status === "rejected") console.error("Error loading uploaded videos:", videoResResult.reason)
    if (enAudioResult.status === "rejected" || urAudioResult.status === "rejected") {
      console.error("Error loading audio stats:", {
        english: enAudioResult.status === "rejected" ? enAudioResult.reason : null,
        urdu: urAudioResult.status === "rejected" ? urAudioResult.reason : null,
      })
    }

    const faceVideos = videoRes.success && Array.isArray(videoRes.data) ? videoRes.data.length : 0
    const en = enAudio.success && Array.isArray(enAudio.data) ? enAudio.data.length : 0
    const ur = urAudio.success && Array.isArray(urAudio.data) ? urAudio.data.length : 0

    setStats({
      lipSyncVideos: lipSync.length,
      voiceSamples: en + ur,
      faceVideos,
    })
    setRecentGenerated(lipSync.slice(0, 6))
    setLoadingStats(false)
  }, [isSignedIn, getToken])

  useEffect(() => {
    if (isSignedIn && user) {
      // Silently upsert this user into the backend on every sign-in so the
      // scripts FK constraint is always satisfied, even for users who skipped onboarding.
      void syncUserToBackend(
        user.emailAddresses[0]?.emailAddress || "",
        user.firstName || undefined,
        user.lastName || undefined,
        getToken
      ).catch(() => { /* non-critical — dashboard still loads */ })
      void loadDashboard()
    }
  }, [isSignedIn, user, loadDashboard, getToken])

  const getStageFromMethod = (method: string, parameters?: any): string => {
    if (method === "generated") {
      return "Script Generation"
    } else if (method === "refinement") {
      if (parameters?.refinementType === "custom") {
        return "Custom Refinement"
      }
      return "Script Refinement"
    }
    return "Script Review"
  }

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return diffMins <= 1 ? "just now" : `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`
    } else {
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`
    }
  }

  const getTitleFromContent = (content: string): string => {
    const firstLine = content.split("\n")[0]
    const title = firstLine.length > 50 ? firstLine.substring(0, 50) + "..." : firstLine
    return title || "Untitled Draft"
  }

  const handleConfirmDeleteDraft = async () => {
    if (!draftToDelete) return
    setDeletingDraft(true)
    try {
      await deleteDraft(draftToDelete.script_id, getToken)
      toast.success("Draft deleted")
      setDraftToDelete(null)
      await loadDashboard()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete draft")
    } finally {
      setDeletingDraft(false)
    }
  }

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

  if (!isSignedIn) {
    return null
  }

  return (
    <DashboardLayout>
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/5 to-transparent p-8 shadow-xl backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-white/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Welcome back</p>
            <h1 className="text-3xl font-bold text-white">Your creator cockpit</h1>
            <p className="mt-2 text-white/70 max-w-2xl">
              Kick off a new script, polish an existing draft, or jump into your media library. The full pipeline lives
              here.
            </p>
          </div>
          <Link href="/dashboard/create-content" className="inline-flex">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-lg shadow-primary/30 hover:scale-[1.01] transition-transform">
              Create Content
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {loadingStats || !stats ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[120px] w-full rounded-2xl bg-white/10" />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              icon={<Clapperboard className="h-5 w-5" />}
              label="Lip-sync videos"
              value={stats.lipSyncVideos}
              subtext={stats.lipSyncVideos === 0 ? "None yet" : "Saved outputs"}
            />
            <StatsCard
              icon={<FileText className="h-5 w-5" />}
              label="Saved drafts"
              value={drafts.length}
              subtext="Ready to continue"
            />
            <StatsCard
              icon={<Mic className="h-5 w-5" />}
              label="Voice samples"
              value={stats.voiceSamples}
              subtext="English + Urdu (Setup)"
            />
            <StatsCard
              icon={<Video className="h-5 w-5" />}
              label="Face videos"
              value={stats.faceVideos}
              subtext="For lip-sync"
            />
          </>
        )}
      </div>

      {/* Your Videos */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Videos</h2>
            <p className="text-sm text-white/60 mt-1">Recent generated lip-sync outputs</p>
          </div>
          <Link href="/dashboard/my-videos">
            <button className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-all">
              View All
            </button>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clapperboard className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">Generated</h3>
          </div>
          {loadingStats ? (
            <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
          ) : recentGenerated.length === 0 ? (
            <p className="text-sm text-white/55">
              No generated videos yet. Run a full pipeline in{" "}
              <Link href="/dashboard/create-content" className="text-primary hover:underline">
                Create Content
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentGenerated.map((item) => (
                <GeneratedVideoCard
                  key={item.jobId}
                  item={item}
                  getToken={getToken}
                  compact
                  showOpenInLibraryLink
                  onDeleted={() => void loadDashboard()}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drafts */}
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
              <div
                key={draft.script_id}
                className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 z-10 h-9 w-9 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                  aria-label="Delete draft"
                  onClick={() => setDraftToDelete(draft)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Link
                  href={`/dashboard/create-content?draftId=${draft.script_id}`}
                  className="group block p-6 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4 pr-10">
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
                      <span className="text-sm text-white/70">{getStageFromMethod(draft.method, draft.parameters)}</span>
                    </div>
                    <p className="text-xs text-white/50">Last edited {getTimeAgo(draft.updated_at)}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-sm text-primary font-medium group-hover:underline">Continue editing →</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!draftToDelete} onOpenChange={(open) => !open && setDraftToDelete(null)}>
        <AlertDialogContent className="bg-black/95 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This permanently removes the saved script. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => void handleConfirmDeleteDraft()}
              disabled={deletingDraft}
            >
              {deletingDraft ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Removed duplicate bottom "My Videos" section by request */}
    </DashboardLayout>
  )
}
