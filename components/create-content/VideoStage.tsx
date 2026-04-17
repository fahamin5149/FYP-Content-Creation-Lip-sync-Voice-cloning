"use client"

import { useCallback, useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
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
  getLipSyncOutputBlobUrl,
  getTTSOutputPath,
  getUserVideo,
  resolveMediaPath,
  runLipSyncProcess,
  uploadVideo,
  type MediaItem,
} from "@/lib/api"
import { AlertCircle, Clapperboard, Loader2, Upload, Video } from "lucide-react"

interface VideoStageProps {
  ttsJobId: string
  getToken: () => Promise<string | null>
  onBack: () => void
}

export default function VideoStage({ ttsJobId, getToken, onBack }: VideoStageProps) {
  const { user, isLoaded: userLoaded } = useUser()
  const userId = user?.id ?? ""

  const [videos, setVideos] = useState<MediaItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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
    setError(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    try {
      const [{ absolutePath: videoPath }, audioPath] = await Promise.all([
        resolveMediaPath(selectedId, "video", getToken),
        getTTSOutputPath(ttsJobId, getToken),
      ])
      const jobId = `lipsync_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`
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
      const url = await getLipSyncOutputBlobUrl(jobId, getToken)
      setPreviewUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lip sync failed")
    } finally {
      setSyncing(false)
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
                <input type="file" accept="video/*" className="hidden" onChange={onUpload} />
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
          <div className="rounded-xl border border-white/10 overflow-hidden bg-black">
            <video src={previewUrl} controls className="w-full max-h-[420px]" playsInline />
            <p className="text-xs text-white/50 px-3 py-2">Result is saved under LIPSYNC_Output for this user.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3 justify-between border-t border-white/10 pt-6">
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={onBack} disabled={syncing}>
          Back
        </Button>
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
      </CardFooter>
    </Card>
  )
}
