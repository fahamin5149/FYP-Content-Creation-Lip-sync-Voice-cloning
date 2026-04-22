"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Upload, Loader2, CheckCircle, AlertCircle, Video, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { getUserVideo, type MediaItem } from "@/lib/api"
import { MediaList } from "./MediaList"
import {
  VIDEO_FILE_INPUT_ACCEPT,
  SUPPORTED_VIDEO_FORMATS_LABEL,
  isSupportedVideoFile,
} from "@/lib/videoFormats"
import { getVideoUploadRejectionReason } from "@/lib/mediaUploadGuards"
import { MAX_USER_VIDEOS } from "@/lib/mediaLimits"
import { runSpeakerValidation } from "@/lib/speakerValidation"

const MAX_VIDEO_SIZE_BYTES = 2048 * 1024 * 1024 // 2 GB — matches server limit
const MAX_VIDEO_DURATION_SEC = 600

type QueueStatus = "pending" | "uploading" | "done" | "error"
type ValidationStatus = "valid" | "invalid"

interface QueueItem {
  id: string
  file: File
  name: string
  previewUrl: string
  addedAtMs: number
  /** Set when upload + server processing complete successfully */
  uploadCompletedAtMs?: number
  batchOrder: number
  status: QueueStatus
  progress: number
  /** True after browser finished sending bytes; server may still be transcoding (ffmpeg) + DB. */
  serverProcessing?: boolean
  validationStatus: ValidationStatus
  validationReason?: string
  errorMsg?: string
}

interface VideoTabProps {
  getToken: () => Promise<string | null>
}

export function VideoTab({ getToken }: VideoTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Queue state ──────────────────────────────────────────────────────────────
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isUploadingAll, setIsUploadingAll] = useState(false)
  const [pickerError, setPickerError] = useState<string | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const [uploadBatch, setUploadBatch] = useState<{ done: number; total: number } | null>(null)

  // ── Server list state ────────────────────────────────────────────────────────
  const [items, setItems] = useState<MediaItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const queueOrderRef = useRef(0)

  const fetchVideos = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await getUserVideo(getToken)
      setItems(res.data ?? [])
    } catch {
      setItems([])
    } finally {
      setLoadingList(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // ── Derived counts ───────────────────────────────────────────────────────────
  const pendingCount = queue.filter(q => q.status === "pending").length
  const errorCount = queue.filter(q => q.status === "error").length
  const uploadingCount = queue.filter(q => q.status === "uploading").length
  const canUploadAll = pendingCount > 0 && !isUploadingAll
  const sortedQueue = useMemo(
    () =>
      [...queue].sort((a, b) => {
        if (a.addedAtMs !== b.addedAtMs) return a.addedAtMs - b.addedAtMs
        return a.batchOrder - b.batchOrder
      }),
    [queue]
  )

  /** Slots not yet on the server: excludes completed queue rows (they are removed after upload). */
  const queueSlotsReserved = useMemo(
    () => queue.filter((q) => q.status === "pending" || q.status === "uploading").length,
    [queue]
  )

  const slotsRemaining = Math.max(0, MAX_USER_VIDEOS - items.length - queueSlotsReserved)

  // ── Queue helpers ────────────────────────────────────────────────────────────
  const updateItemStatus = (id: string, status: QueueStatus, errorMsg?: string) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status, errorMsg } : i))
  }
  const updateItemProgress = (id: string, progress: number) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, progress } : i))
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter(i => i.id !== id)
    })
  }

  const validateVideoFile = async (file: File): Promise<{ valid: boolean; reason?: string }> => {
    if (!file || file.size <= 0) return { valid: false, reason: "0-byte video is not allowed." }
    const audioWrong = getVideoUploadRejectionReason(file)
    if (audioWrong) return { valid: false, reason: audioWrong }
    if (file.size > MAX_VIDEO_SIZE_BYTES) return { valid: false, reason: "Exceeds 2 GB limit." }
    if (!isSupportedVideoFile(file)) {
      return { valid: false, reason: `Unsupported format. Supported: ${SUPPORTED_VIDEO_FORMATS_LABEL}.` }
    }
    const objectUrl = URL.createObjectURL(file)
    try {
      const metadata = await new Promise<{ width: number; height: number; duration: number }>((resolve, reject) => {
        const video = document.createElement("video")
        video.preload = "metadata"
        video.onloadedmetadata = () => {
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
          })
        }
        video.onerror = () => reject(new Error("Video codec/container not compatible."))
        video.src = objectUrl
      })
      if (!Number.isFinite(metadata.duration) || metadata.duration <= 0) {
        return { valid: false, reason: "Invalid video duration." }
      }
      if (metadata.duration > MAX_VIDEO_DURATION_SEC) {
        return { valid: false, reason: `Duration exceeds ${Math.floor(MAX_VIDEO_DURATION_SEC / 60)} minutes.` }
      }
      return { valid: true }
    } catch (err: unknown) {
      return { valid: false, reason: err instanceof Error ? err.message : "Video codec not compatible." }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  const enqueueValidatedVideo = async (file: File, batchOrder: number) => {
    const validation = await validateVideoFile(file)
    setQueue(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        addedAtMs: Date.now(),
        batchOrder,
        status: validation.valid ? "pending" : "error",
        progress: 0,
        validationStatus: validation.valid ? "valid" : "invalid",
        validationReason: validation.reason,
        errorMsg: validation.valid ? undefined : validation.reason,
      },
    ])
  }

  const uploadVideoWithProgress = async (
    item: QueueItem,
    onProgress: (pct: number) => void,
    onUploadBytesDone?: () => void
  ): Promise<void> => {
    const token = await getToken()
    if (!token) throw new Error("Not authenticated")
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    const endpoint = `${API_URL}/api/media/video`
    const formData = new FormData()
    formData.append("file", item.file, item.name)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", endpoint)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      // Large videos: upload can be slow; server may run ffmpeg after upload — allow long wait.
      xhr.timeout = 0
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          // Reserve headroom: 0–85% = bytes to server; after that = server processing until response.
          onProgress(Math.round((e.loaded / e.total) * 85))
        }
      }
      xhr.upload.onload = () => {
        onUploadBytesDone?.()
        onProgress(90)
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100)
          resolve()
          return
        }
        try {
          const data = JSON.parse(xhr.responseText || "{}")
          reject(new Error(data.error || "Upload failed"))
        } catch {
          reject(new Error(xhr.responseText || "Upload failed"))
        }
      }
      xhr.onerror = () => reject(new Error("Network error during upload"))
      xhr.ontimeout = () => reject(new Error("Request timed out"))
      xhr.send(formData)
    })
  }

  // ── File picker handler ──────────────────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPickerError(null)

    const remaining = slotsRemaining
    if (remaining <= 0) {
      setPickerError(
        items.length >= MAX_USER_VIDEOS
          ? `You already have ${MAX_USER_VIDEOS} video templates. Delete one in Uploaded below to add more.`
          : "No free slots while uploads are in progress. Wait for uploads to finish or remove a pending file."
      )
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const acceptedByLimit = files.slice(0, remaining)
    const overflow = files.slice(remaining)
    const wrongKind = acceptedByLimit.filter((f) => getVideoUploadRejectionReason(f) != null)
    const maybeVideo = acceptedByLimit.filter((f) => getVideoUploadRejectionReason(f) == null)
    const supported = maybeVideo.filter((f) => isSupportedVideoFile(f))
    const unsupported = maybeVideo.filter((f) => !isSupportedVideoFile(f))
    const oversized = supported.filter(f => f.size > MAX_VIDEO_SIZE_BYTES)
    const valid = supported.filter(f => f.size <= MAX_VIDEO_SIZE_BYTES)

    let warn = ""
    if (files.length > remaining) warn = `${remaining} of ${files.length} files accepted (you can store up to ${MAX_USER_VIDEOS} videos total). `
    if (wrongKind.length) {
      warn += `${wrongKind.length} file(s) skipped — not video (use Voice setup for audio files). `
    }
    if (unsupported.length) warn += `${unsupported.length} file(s) skipped — unsupported format. Supported: ${SUPPORTED_VIDEO_FORMATS_LABEL}. `
    if (oversized.length) warn += `${oversized.length} file(s) skipped — exceeds 2 GB limit. `
    const overflowNames = overflow.map((f) => f.name)
    if (overflowNames.length) warn += `Skipped (limit): ${overflowNames.join(", ")}. `
    if (warn) setPickerError(warn.trim())

    const baseOrder = queueOrderRef.current + 1
    valid.forEach(async (f, idx) => {
      await enqueueValidatedVideo(f, baseOrder + idx)
    })
    queueOrderRef.current += valid.length
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Upload all ───────────────────────────────────────────────────────────────
  const uploadAll = async () => {
    setIsUploadingAll(true)
    setPickerError(null)

    const toUpload = sortedQueue.filter(i => i.status === "pending" && i.validationStatus === "valid")
    if (toUpload.length === 0) {
      setPickerError("No valid files to upload.")
      toast.error("No valid video files to upload.", { duration: 4000 })
      setIsUploadingAll(false)
      return
    }
    toast.message(`Uploading ${toUpload.length} file(s)…`, { duration: 4000 })
    setOverallProgress(0)
    setUploadBatch({ done: 0, total: toUpload.length })
    let successCount = 0

    for (let idx = 0; idx < toUpload.length; idx++) {
      const item = toUpload[idx]
      updateItemStatus(item.id, "uploading")
      setQueue(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, serverProcessing: false, progress: 0 } : i
        )
      )
      try {
        await uploadVideoWithProgress(
          item,
          (pct) => {
            updateItemProgress(item.id, pct)
          },
          () => {
            setQueue(prev =>
              prev.map(i => (i.id === item.id ? { ...i, serverProcessing: true } : i))
            )
          }
        )
        const speakerCheck = await runSpeakerValidation(item.file, 4)
        if (speakerCheck.status === "warning" && speakerCheck.code === "MULTIPLE_SPEAKERS_DETECTED") {
          toast.warning(speakerCheck.message, {
            duration: 6000,
            description: `Detected up to ${speakerCheck.details.max_detected_persons} people across ${speakerCheck.details.frames_analyzed} sampled frames. ${speakerCheck.action.suggestion}`,
          })
        }
        successCount += 1
        removeFromQueue(item.id)
      } catch (err: any) {
        const msg = err.message || "Upload failed"
        let friendly = msg
        if (msg.includes("exceeds")) friendly = "Exceeds 2 GB limit."
        else if (msg.toLowerCase().includes("unsupported")) friendly = `Unsupported format. Supported: ${SUPPORTED_VIDEO_FORMATS_LABEL}.`
        updateItemStatus(item.id, "error", friendly)
        updateItemProgress(item.id, 100)
        setQueue(prev =>
          prev.map(i => (i.id === item.id ? { ...i, serverProcessing: false } : i))
        )
        toast.error(`Upload failed for ${item.name}. Reason: ${friendly}.`, { duration: 4000 })
      }
      setUploadBatch({ done: idx + 1, total: toUpload.length })
      setOverallProgress(Math.round(((idx + 1) / toUpload.length) * 100))
    }

    setIsUploadingAll(false)
    setUploadBatch(null)
    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully.`, { duration: 4000 })
      void fetchVideos()
    }
  }

  const handleDelete = (id: string) =>
    setItems(prev => prev.filter(i => i.id !== id))

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Video Template</h2>
            <p className="text-sm text-white/40 mt-0.5">
              Upload video templates — audio will be replaced by generated voice. After upload, the server may transcode to MP4; progress can pause near 90% until that finishes.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={VIDEO_FILE_INPUT_ACCEPT}
          multiple
          className="hidden"
          onChange={handleFilePick}
        />

        {/* Drop zone */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={slotsRemaining <= 0}
          className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-xl p-10 text-white/50 hover:text-white/80 hover:border-white/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="p-3 rounded-full bg-white/5 border border-white/10">
            <Upload className="h-6 w-6" />
          </div>
          <span className="text-sm font-medium">Click to browse video files</span>
          <span className="text-xs text-white/30">
            Supported: {SUPPORTED_VIDEO_FORMATS_LABEL}. Max {MAX_USER_VIDEOS} videos per account ({items.length} saved
            {queueSlotsReserved > 0 ? ` · ${queueSlotsReserved} uploading/queued` : ""}). Max 2GB each. Validation: any
            resolution up to 4K, max {Math.floor(MAX_VIDEO_DURATION_SEC / 60)} min.
          </span>
        </button>

        {/* Queue summary banner */}
        {queue.length > 0 && (
          <div className="flex items-center justify-between text-xs text-white/50 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <span>
              {queue.length} file{queue.length !== 1 ? "s" : ""} queued
              {pendingCount > 0 && ` · ${pendingCount} pending`}
              {errorCount > 0 && ` · ${errorCount} failed`}
              {uploadingCount > 0 && ` · uploading...`}
            </span>
            <span className="text-white/30">
              {queue.length} in queue · {slotsRemaining} slot{slotsRemaining !== 1 ? "s" : ""} left
            </span>
          </div>
        )}

        {/* Queue item list */}
        {queue.length > 0 && (
          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            {sortedQueue.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                {/* Row: status icon + name + badges + remove */}
                <div className="flex items-center gap-2">
                  {item.status === "pending"   && <span className="h-2 w-2 rounded-full bg-white/30 shrink-0" />}
                  {item.status === "uploading" && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />}
                  {item.status === "done"      && <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />}
                  {item.status === "error"     && <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}

                  <span className="text-xs text-white/70 truncate flex-1">{item.name}</span>
                  <div className="text-[10px] text-white/40 shrink-0 text-right leading-tight">
                    <div>Added {new Date(item.addedAtMs).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                    {item.status === "done" && item.uploadCompletedAtMs != null && (
                      <div className="text-emerald-400/90 mt-0.5">
                        Uploaded {new Date(item.uploadCompletedAtMs).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </div>
                    )}
                  </div>

                  {item.validationStatus === "valid" ? (
                    <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5 shrink-0">
                      Valid
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 shrink-0">
                      Invalid
                    </span>
                  )}

                  {item.status === "done" && (
                    <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5 shrink-0">
                      Done
                    </span>
                  )}
                  {item.status === "uploading" && (
                    <span className="text-[10px] text-primary/80 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 shrink-0">
                      {item.serverProcessing ? "Processing on server…" : "Uploading…"}
                    </span>
                  )}
                  {item.status === "error" && (
                    <button
                      onClick={() =>
                        setQueue((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? { ...i, status: "pending" as const, errorMsg: undefined, uploadCompletedAtMs: undefined }
                              : i
                          )
                        )
                      }
                      className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-1.5 py-0.5 shrink-0 hover:bg-yellow-500/20 flex items-center gap-1"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Retry
                    </button>
                  )}
                  {(item.status === "pending" || item.status === "error") && (
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="text-white/30 hover:text-red-400 transition-colors shrink-0 ml-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Error message */}
                {item.status === "error" && item.errorMsg && (
                  <p className="text-[11px] text-red-400/80 pl-5">{item.errorMsg}</p>
                )}
                {item.validationStatus === "invalid" && item.validationReason && (
                  <p className="text-[11px] text-red-400/80 pl-5">Validation: {item.validationReason}</p>
                )}

                {/* Video preview */}
                <video
                  controls
                  src={item.previewUrl}
                  className="w-full rounded-lg max-h-48 bg-black"
                />
                {(item.status === "uploading" || item.status === "done" || item.status === "error") && (
                  <div className="space-y-1">
                    <Progress value={item.progress} className={item.status === "error" ? "bg-red-950" : ""} />
                    <p className="text-[10px] text-white/40 text-right">{item.progress}%</p>
                    {item.status === "uploading" && item.serverProcessing && (
                      <p className="text-[10px] text-white/50 pl-0.5">
                        Upload finished — server is normalizing/transcoding (ffmpeg). This can take several minutes for long clips; the bar may stay near 90% until done.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Picker / queue warning */}
        {pickerError && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {pickerError}
          </div>
        )}

        {/* Upload All button */}
        {queue.length > 0 && (
          <div className="space-y-3">
            {isUploadingAll && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                  <span>Batch progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} />
              </div>
            )}
            <Button
              onClick={uploadAll}
              disabled={!canUploadAll}
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
            >
              {isUploadingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                  {uploadBatch ? ` (${uploadBatch.done}/${uploadBatch.total})` : ""}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload All ({pendingCount} file{pendingCount !== 1 ? "s" : ""})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Existing videos list */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <MediaList
          items={items}
          type="video"
          isLoading={loadingList}
          onDelete={handleDelete}
          label="Uploaded Video Templates"
          getToken={getToken}
        />
      </div>
    </div>
  )
}
