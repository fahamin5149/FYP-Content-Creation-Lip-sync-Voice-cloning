"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Upload, Loader2, CheckCircle, AlertCircle, Video, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUserVideo, uploadVideo, type MediaItem } from "@/lib/api"
import { MediaList } from "./MediaList"

const MAX_VIDEO_SIZE_BYTES = 2048 * 1024 * 1024 // 2 GB — matches server limit
const MAX_QUEUE = 10

type QueueStatus = "pending" | "uploading" | "done" | "error"

interface QueueItem {
  id: string
  file: File
  name: string
  previewUrl: string
  status: QueueStatus
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

  // ── Server list state ────────────────────────────────────────────────────────
  const [items, setItems] = useState<MediaItem[]>([])
  const [loadingList, setLoadingList] = useState(true)

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
  const doneCount = queue.filter(q => q.status === "done").length
  const pendingCount = queue.filter(q => q.status === "pending").length
  const errorCount = queue.filter(q => q.status === "error").length
  const uploadingCount = queue.filter(q => q.status === "uploading").length
  const canUploadAll = (pendingCount + errorCount) > 0 && !isUploadingAll

  // ── Queue helpers ────────────────────────────────────────────────────────────
  const updateItemStatus = (id: string, status: QueueStatus, errorMsg?: string) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status, errorMsg } : i))
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter(i => i.id !== id)
    })
  }

  // ── File picker handler ──────────────────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPickerError(null)

    const remaining = MAX_QUEUE - queue.length
    if (remaining <= 0) {
      setPickerError(`Queue is full. Maximum ${MAX_QUEUE} files allowed.`)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const toAdd = files.slice(0, remaining)
    const oversized = toAdd.filter(f => f.size > MAX_VIDEO_SIZE_BYTES)
    const valid = toAdd.filter(f => f.size <= MAX_VIDEO_SIZE_BYTES)

    let warn = ""
    if (files.length > remaining) warn = `Only ${remaining} slot(s) left in queue. `
    if (oversized.length) warn += `${oversized.length} file(s) skipped — exceeds 2 GB limit.`
    if (warn) setPickerError(warn.trim())

    const newItems: QueueItem[] = valid.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      previewUrl: URL.createObjectURL(f),
      status: "pending",
    }))

    setQueue(prev => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Upload all ───────────────────────────────────────────────────────────────
  const uploadAll = async () => {
    setIsUploadingAll(true)
    setPickerError(null)

    const toUpload = queue.filter(i => i.status === "pending" || i.status === "error")
    let anySuccess = false

    for (const item of toUpload) {
      updateItemStatus(item.id, "uploading")
      try {
        const formData = new FormData()
        formData.append("file", item.file, item.name)
        await uploadVideo(formData, getToken)
        updateItemStatus(item.id, "done")
        anySuccess = true
      } catch (err: any) {
        const msg = err.message || "Upload failed"
        let friendly = msg
        if (msg.includes("exceeds")) friendly = "Exceeds 2 GB limit."
        else if (msg.includes("not supported")) friendly = "File type not supported."
        updateItemStatus(item.id, "error", friendly)
      }
    }

    setIsUploadingAll(false)
    if (anySuccess) fetchVideos()
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
              Upload video templates — audio will be replaced by generated voice
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          multiple
          className="hidden"
          onChange={handleFilePick}
        />

        {/* Drop zone */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={queue.length >= MAX_QUEUE}
          className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-xl p-10 text-white/50 hover:text-white/80 hover:border-white/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="p-3 rounded-full bg-white/5 border border-white/10">
            <Upload className="h-6 w-6" />
          </div>
          <span className="text-sm font-medium">Click to browse video files</span>
          <span className="text-xs text-white/30">MP4, WebM, MOV, AVI — max 2 GB each · up to {MAX_QUEUE} files</span>
        </button>

        {/* Queue summary banner */}
        {queue.length > 0 && (
          <div className="flex items-center justify-between text-xs text-white/50 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <span>
              {queue.length} file{queue.length !== 1 ? "s" : ""} queued
              {doneCount > 0 && ` · ${doneCount} uploaded`}
              {pendingCount > 0 && ` · ${pendingCount} pending`}
              {errorCount > 0 && ` · ${errorCount} failed`}
              {uploadingCount > 0 && ` · uploading...`}
            </span>
            <span className="text-white/30">{queue.length}/{MAX_QUEUE}</span>
          </div>
        )}

        {/* Queue item list */}
        {queue.length > 0 && (
          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            {queue.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                {/* Row: status icon + name + badges + remove */}
                <div className="flex items-center gap-2">
                  {item.status === "pending"   && <span className="h-2 w-2 rounded-full bg-white/30 shrink-0" />}
                  {item.status === "uploading" && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />}
                  {item.status === "done"      && <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />}
                  {item.status === "error"     && <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}

                  <span className="text-xs text-white/70 truncate flex-1">{item.name}</span>

                  {item.status === "done" && (
                    <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5 shrink-0">
                      Done
                    </span>
                  )}
                  {item.status === "uploading" && (
                    <span className="text-[10px] text-primary/80 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 shrink-0">
                      Uploading...
                    </span>
                  )}
                  {item.status === "error" && (
                    <button
                      onClick={() => updateItemStatus(item.id, "pending")}
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

                {/* Video preview */}
                <video
                  controls
                  src={item.previewUrl}
                  className="w-full rounded-lg max-h-48 bg-black"
                />
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
          <Button
            onClick={uploadAll}
            disabled={!canUploadAll}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
          >
            {isUploadingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading... ({doneCount}/{doneCount + pendingCount + errorCount + uploadingCount})
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload All ({pendingCount + errorCount} file{pendingCount + errorCount !== 1 ? "s" : ""})
              </>
            )}
          </Button>
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
