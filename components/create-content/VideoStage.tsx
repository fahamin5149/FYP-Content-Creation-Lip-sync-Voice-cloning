"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getLipSyncExportBlobUrl,
  getLipSyncOutputBlobUrl,
  getTTSOutputPath,
  getUserVideo,
  resolveMediaPath,
  runLipSyncProcess,
  uploadVideoToYouTube,
  uploadVideo,
  type LipSyncExportFormat,
  type MediaItem,
  type YouTubePrivacy,
} from "@/lib/api"
import { AlertCircle, CheckCircle2, Clapperboard, Copy, Download, Loader2, Share2, Upload, Video } from "lucide-react"
import {
  INTERNAL_VIDEO_FORMAT_LABEL,
  SUPPORTED_VIDEO_FORMATS_LABEL,
  VIDEO_FILE_INPUT_ACCEPT,
  isSupportedVideoFile,
} from "@/lib/videoFormats"
import { getVideoUploadRejectionReason } from "@/lib/mediaUploadGuards"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  completeGenerationTask,
  failGenerationTask,
  startGenerationTask,
  updateGenerationTask,
} from "@/lib/generationQueue"

interface VideoStageProps {
  ttsJobId: string
  getToken: () => Promise<string | null>
}

export default function VideoStage({ ttsJobId, getToken }: VideoStageProps) {
  const router = useRouter()
  const { user, isLoaded: userLoaded } = useUser()
  const userId = user?.id ?? ""

  const [videos, setVideos] = useState<MediaItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [latestJobId, setLatestJobId] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<LipSyncExportFormat>("mp4")
  const [lipSyncProgress, setLipSyncProgress] = useState(0)
  const [partialWarning, setPartialWarning] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [ytAccessToken, setYtAccessToken] = useState<string | null>(null)
  const [ytUploading, setYtUploading] = useState(false)
  const [ytUploadProgress, setYtUploadProgress] = useState(0)
  const [ytError, setYtError] = useState<string | null>(null)
  const [ytLink, setYtLink] = useState<string | null>(null)
  const [ytTitle, setYtTitle] = useState("Generated Lip-sync Video")
  const [ytDescription, setYtDescription] = useState("")
  const [ytPrivacy, setYtPrivacy] = useState<YouTubePrivacy>("unlisted")
  /** Wav2Lip loads all frames in RAM; higher factor = smaller frames, less memory. */
  const [resizePreset, setResizePreset] = useState<"high" | "balanced" | "low">("balanced")

  const resizeFactor = resizePreset === "high" ? 1 : resizePreset === "low" ? 4 : 2

  const loadVideos = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      const res = await getUserVideo(getToken)
      if (res.success && res.data) {
        setVideos(res.data)
        if (res.data.length === 1) setSelectedId(res.data[0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load videos")
    } finally {
      setLoadingList(false)
    }
  }, [getToken])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const notVideo = getVideoUploadRejectionReason(file)
    if (notVideo) {
      setError(notVideo)
      return
    }
    if (!isSupportedVideoFile(file)) {
      setError(`Unsupported video format. Supported formats: ${SUPPORTED_VIDEO_FORMATS_LABEL}.`)
      return
    }
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await uploadVideo(fd, getToken)
      if (res.success && res.data) {
        setVideos((prev) => [res.data, ...prev])
        setSelectedId(res.data.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const runWav2Lip = async () => {
    if (!userId) {
      setError("You must be signed in.")
      return
    }
    if (!selectedId) {
      setError("Select or upload a face video first.")
      return
    }
    setSyncing(true)
    setLipSyncProgress(0)
    setError(null)
    setPartialWarning(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    let startedTaskId: string | null = null
    let progressTimer: ReturnType<typeof window.setInterval> | null = null
    try {
      const [{ absolutePath: videoPath }, audioPath] = await Promise.all([
        resolveMediaPath(selectedId, "video", getToken),
        getTTSOutputPath(ttsJobId, getToken),
      ])
      const jobId = `lipsync_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`
      const taskId = startGenerationTask("Lip-sync video")
      startedTaskId = taskId
      let progress = 5
      setLipSyncProgress(progress)
      updateGenerationTask(taskId, { progress })
      progressTimer = window.setInterval(() => {
        progress = Math.min(90, progress + 4)
        setLipSyncProgress(progress)
        updateGenerationTask(taskId, { progress })
      }, 2500)

      await runLipSyncProcess({
        videoPath,
        audioPath,
        userId,
        jobId,
        syncSettings: {
          quality: "medium",
          resize_factor: resizeFactor,
          ...(resizePreset === "low" ? { wav2lip_batch_size: 16, face_det_batch_size: 4 } : {}),
        },
      })
      const url = await getLipSyncOutputBlobUrl(jobId, getToken).catch(() => null)
      updateGenerationTask(taskId, { progress: 100 })
      setLipSyncProgress(100)
      completeGenerationTask(taskId, jobId)
      setPreviewUrl(url)
      setLatestJobId(jobId)
      if (!url) {
        setPartialWarning("Generation completed, but preview fetch failed. The job exists and can still be exported or retried.")
      } else {
        toast.success("Generation complete - view result", { duration: 5000 })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lip sync failed"
      setError(msg)
      setLipSyncProgress(0)
      if (startedTaskId) failGenerationTask(startedTaskId, msg)
      toast.error(`Generation failed - ${msg}`, { duration: 5000 })
    } finally {
      if (progressTimer != null) window.clearInterval(progressTimer)
      setSyncing(false)
    }
  }

  const ensureGoogleScript = async () => {
    if (typeof window === "undefined") return
    const existing = document.getElementById("google-identity-services")
    if (existing) return
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.id = "google-identity-services"
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Google Identity Services"))
      document.body.appendChild(script)
    })
  }

  const connectYouTube = async () => {
    try {
      setYtError(null)
      await ensureGoogleScript()
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) throw new Error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID")
      const googleObj = (window as Window & { google?: any }).google
      if (!googleObj?.accounts?.oauth2) throw new Error("Google OAuth client unavailable")
      const tokenClient = googleObj.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/youtube.upload",
        callback: (resp: { access_token?: string; error?: string }) => {
          if (resp.error || !resp.access_token) {
            setYtError(resp.error || "YouTube authorization failed")
            return
          }
          setYtAccessToken(resp.access_token)
          toast.success("YouTube connected successfully.")
        },
      })
      tokenClient.requestAccessToken({ prompt: "consent" })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect YouTube"
      setYtError(msg)
      toast.error(msg)
    }
  }

  const handleYouTubeUpload = async () => {
    if (!previewUrl) {
      setYtError("No generated video available.")
      return
    }
    if (!ytAccessToken) {
      setYtError("Connect YouTube first.")
      return
    }
    setYtUploading(true)
    setYtError(null)
    setYtLink(null)
    try {
      const blob = await fetch(previewUrl).then((r) => r.blob())
      const result = await uploadVideoToYouTube({
        accessToken: ytAccessToken,
        videoBlob: blob,
        title: ytTitle.trim() || "Generated Lip-sync Video",
        description: ytDescription,
        privacyStatus: ytPrivacy,
        onProgress: setYtUploadProgress,
      })
      setYtLink(result.url)
      toast.success("Video uploaded to YouTube.")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "YouTube upload failed"
      setYtError(msg)
      toast.error(msg)
    } finally {
      setYtUploading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!latestJobId) return
    const link = `${window.location.origin}/dashboard/my-videos`
    await navigator.clipboard.writeText(link)
    toast.success("Result link copied.")
  }

  const handleExport = async () => {
    if (!latestJobId) {
      setError("No generated video found for export.")
      toast.error("No generated video found for export.")
      return
    }
    setExporting(true)
    setError(null)
    toast.message(`Exporting as ${exportFormat.toUpperCase()}...`)
    try {
      const blobUrl = await getLipSyncExportBlobUrl(latestJobId, exportFormat, getToken)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `${latestJobId}.${exportFormat}`
      a.click()
      URL.revokeObjectURL(blobUrl)
      toast.success(`Exported as ${exportFormat.toUpperCase()}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Export as ${exportFormat.toUpperCase()} failed`
      setError(msg)
      toast.error(msg)
    } finally {
      setExporting(false)
    }
  }

  if (!userLoaded) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="flex items-center gap-3 py-10 justify-center text-white/70">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading…
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/40 text-primary gap-1">
            <Clapperboard className="h-3 w-3" />
            Wav2Lip
          </Badge>
        </div>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Video className="h-7 w-7 text-primary" />
          Lip-sync video
        </CardTitle>
        <CardDescription className="text-white/70">
          Use a talking-head clip (face clearly visible). The Wav2Lip service (port 8002) scales your file to{" "}
          <span className="text-white/90">320px width</span> with ffmpeg, then runs lip-sync against your TTS audio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {partialWarning && (
          <div className="flex gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{partialWarning}</span>
          </div>
        )}
        {syncing && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm text-white/85">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                Generating lip-sync…
              </span>
              <span className="text-xs text-white/60 tabular-nums">{lipSyncProgress}%</span>
            </div>
            <Progress value={lipSyncProgress} />
            <p className="text-xs text-white/50">
              Wav2Lip is processing your video. Long clips can take several minutes — progress updates while the job runs.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
          <p className="text-sm text-white/80 font-medium">Resolution / memory</p>
          <p className="text-xs text-white/50">
            Input is already scaled to 320px wide on the server. These options apply an extra shrink inside Wav2Lip if
            you still hit memory limits on very long clips.
          </p>
          <select
            value={resizePreset}
            onChange={(e) => setResizePreset(e.target.value as "high" | "balanced" | "low")}
            className="w-full max-w-md rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="high">High detail (full size — needs most RAM)</option>
            <option value="balanced">Balanced (half size — default)</option>
            <option value="low">Lower memory (quarter size)</option>
          </select>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
          <p className="text-sm text-white/80 font-medium">Face video</p>
          <p className="text-xs text-white/50">
            Supported upload formats: {SUPPORTED_VIDEO_FORMATS_LABEL}. All uploads are normalized to {INTERNAL_VIDEO_FORMAT_LABEL}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              disabled={uploading}
              asChild
            >
              <label className="cursor-pointer flex items-center gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload video
                <input type="file" accept={VIDEO_FILE_INPUT_ACCEPT} className="hidden" onChange={onUpload} />
              </label>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={loadVideos}
              disabled={loadingList}
            >
              Refresh list
            </Button>
          </div>
          {loadingList ? (
            <p className="text-sm text-white/50">Loading your videos…</p>
          ) : videos.length === 0 ? (
            <p className="text-sm text-white/60">
              No saved videos yet. Upload an MP4/MOV clip from Setup, or use the button above.
            </p>
          ) : (
            <ul className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {videos.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(v.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selectedId === v.id
                        ? "border-primary bg-primary/15 text-white"
                        : "border-white/15 bg-black/20 text-white/85 hover:border-white/30"
                    }`}
                  >
                    <span className="font-medium truncate block">{v.filename}</span>
                    <span className="text-xs text-white/50">
                      {v.size_bytes ? `${(v.size_bytes / (1024 * 1024)).toFixed(1)} MB` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {previewUrl && (
          <div className="rounded-xl border border-emerald-500/30 overflow-hidden bg-black/40 space-y-3 p-3">
            <p className="text-sm font-medium text-emerald-200 flex items-center gap-2 px-1">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Video generated
            </p>
            <video src={previewUrl} controls className="w-full max-h-[420px] rounded-lg" playsInline />
            <p className="text-xs text-white/50 px-1 pb-1">
              Result is saved under LIPSYNC_Output for this user. Use Complete below to return to the dashboard.
            </p>
            <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
              <span className="text-xs text-white/70">Export As</span>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as LipSyncExportFormat)}
                className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-xs text-white"
                disabled={exporting}
              >
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
                <option value="webm">WEBM</option>
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 gap-2"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>Export</>
                )}
              </Button>
              <Button type="button" variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 gap-2" onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button type="button" variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 gap-2" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button type="button" variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3 justify-end border-t border-white/10 pt-6">
        <div className="flex flex-wrap gap-3 justify-end">
          {previewUrl && (
            <>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 gap-2"
                onClick={runWav2Lip}
                disabled={syncing || !selectedId || uploading}
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Clapperboard className="h-4 w-4" />
                    Generate again
                  </>
                )}
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-primary/80 text-white gap-2"
                onClick={() => router.push("/dashboard")}
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </Button>
            </>
          )}
          {!previewUrl && (
            <Button
              className="bg-gradient-to-r from-primary to-primary/80 text-white gap-2"
              onClick={runWav2Lip}
              disabled={syncing || !selectedId || uploading}
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Wav2Lip…
                </>
              ) : (
                <>
                  <Clapperboard className="h-4 w-4" />
                  Generate lip-sync
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
    <Dialog open={shareOpen} onOpenChange={setShareOpen}>
      <DialogContent className="bg-black/95 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Share to YouTube</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!ytAccessToken ? (
            <Button onClick={connectYouTube} className="w-full bg-red-600 hover:bg-red-700 text-white">
              Connect YouTube
            </Button>
          ) : (
            <p className="text-xs text-emerald-300">YouTube account connected.</p>
          )}
          <Input value={ytTitle} onChange={(e) => setYtTitle(e.target.value)} placeholder="Video title" />
          <Textarea value={ytDescription} onChange={(e) => setYtDescription(e.target.value)} placeholder="Video description" />
          <div>
            <p className="text-xs text-white/60 mb-1">Privacy</p>
            <Select value={ytPrivacy} onValueChange={(v) => setYtPrivacy(v as YouTubePrivacy)}>
              <SelectTrigger className="w-full border-white/20 bg-black/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {ytUploading && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                <span>YouTube upload progress</span>
                <span>{ytUploadProgress}%</span>
              </div>
              <Progress value={ytUploadProgress} />
            </div>
          )}
          {ytLink && (
            <a href={ytLink} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
              {ytLink}
            </a>
          )}
          {ytError && <p className="text-xs text-red-300">{ytError}</p>}
          <p className="text-xs text-white/50">
            Fallbacks: you can still use Download or Copy Link without connecting YouTube.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setShareOpen(false)}>
            Close
          </Button>
          <Button onClick={handleYouTubeUpload} disabled={!previewUrl || ytUploading} className="bg-primary text-white">
            {ytUploading ? "Uploading..." : "Upload to YouTube"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
