"use client"

import { useRef, useState } from "react"
import { Mic, Upload, Square, RotateCcw, Loader2, CheckCircle, AlertCircle, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadAudio } from "@/lib/api"

const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB — matches server limit
const MAX_RECORDING_MS = 5 * 60 * 1000        // 5 minutes
const MAX_QUEUE = 10

interface VoiceSectionProps {
  language: "english" | "urdu"
  onUploadSuccess: () => void
  getToken: () => Promise<string | null>
}

type InputMode = "record" | "upload"
type RecordState = "idle" | "recording" | "stopped"
type QueueStatus = "pending" | "uploading" | "done" | "error"

interface QueueItem {
  id: string
  file: File | Blob
  name: string
  previewUrl: string
  status: QueueStatus
  errorMsg?: string
}

export function VoiceSection({ language, onUploadSuccess, getToken }: VoiceSectionProps) {
  const [inputMode, setInputMode] = useState<InputMode>("upload")

  // ── Queue state ──────────────────────────────────────────────────────────────
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isUploadingAll, setIsUploadingAll] = useState(false)
  const [pickerError, setPickerError] = useState<string | null>(null)

  // ── Recording state ──────────────────────────────────────────────────────────
  const [recordState, setRecordState] = useState<RecordState>("idle")
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [recordingPreviewUrl, setRecordingPreviewUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordingCountRef = useRef(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // ── Recording handlers ───────────────────────────────────────────────────────
  const startRecording = async () => {
    setPickerError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        setRecordingBlob(blob)
        setRecordingPreviewUrl(url)
        setRecordState("stopped")
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }

      recorder.start()
      setRecordState("recording")

      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop()
        }
      }, MAX_RECORDING_MS)
    } catch {
      setPickerError("Microphone access denied. Please allow microphone permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }

  const resetRecording = () => {
    if (recordingPreviewUrl) URL.revokeObjectURL(recordingPreviewUrl)
    setRecordingBlob(null)
    setRecordingPreviewUrl(null)
    setRecordState("idle")
  }

  const addRecordingToQueue = () => {
    if (!recordingBlob || !recordingPreviewUrl) return
    if (queue.length >= MAX_QUEUE) {
      setPickerError(`Queue is full. Maximum ${MAX_QUEUE} files allowed.`)
      return
    }
    recordingCountRef.current += 1
    const item: QueueItem = {
      id: crypto.randomUUID(),
      file: recordingBlob,
      name: `Recording-${recordingCountRef.current}.webm`,
      previewUrl: recordingPreviewUrl, // ownership transferred to queue
      status: "pending",
    }
    setQueue(prev => [...prev, item])
    // clear recording state without revoking URL (queue now owns it)
    setRecordingBlob(null)
    setRecordingPreviewUrl(null)
    setRecordState("idle")
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
    const oversized = toAdd.filter(f => f.size > MAX_AUDIO_SIZE_BYTES)
    const valid = toAdd.filter(f => f.size <= MAX_AUDIO_SIZE_BYTES)

    let warn = ""
    if (files.length > remaining) warn = `Only ${remaining} slot(s) left in queue. `
    if (oversized.length) warn += `${oversized.length} file(s) skipped — exceeds 50 MB limit.`
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

    // snapshot of items needing upload (pending + error = retry)
    const toUpload = queue.filter(i => i.status === "pending" || i.status === "error")
    let anySuccess = false

    for (const item of toUpload) {
      updateItemStatus(item.id, "uploading")
      try {
        const formData = new FormData()
        formData.append("file", item.file, item.name)
        formData.append("language", language)
        await uploadAudio(formData, getToken)
        updateItemStatus(item.id, "done")
        anySuccess = true
      } catch (err: any) {
        const msg = err.message || "Upload failed"
        let friendly = msg
        if (msg.includes("exceeds")) friendly = "Exceeds 50 MB limit."
        else if (msg.includes("not supported")) friendly = "File type not supported."
        updateItemStatus(item.id, "error", friendly)
      }
    }

    setIsUploadingAll(false)
    if (anySuccess) onUploadSuccess()
  }

  // ── Mode switch ──────────────────────────────────────────────────────────────
  const switchMode = (mode: InputMode) => {
    resetRecording()
    setPickerError(null)
    setInputMode(mode)
  }

  const label = language === "english" ? "English Voice" : "Urdu Voice"

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-white">{label}</h2>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => switchMode("upload")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            inputMode === "upload"
              ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
              : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload Files
        </button>
        <button
          onClick={() => switchMode("record")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            inputMode === "record"
              ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
              : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <Mic className="h-4 w-4" />
          Live Record
        </button>
      </div>

      {/* ── Upload mode ──────────────────────────────────────────────────────── */}
      {inputMode === "upload" && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={handleFilePick}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={queue.length >= MAX_QUEUE}
            className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-xl p-8 text-white/50 hover:text-white/80 hover:border-white/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm">Click to browse audio files</span>
            <span className="text-xs text-white/30">MP3, WAV, OGG, WebM, M4A — max 50 MB each · up to {MAX_QUEUE} files</span>
          </button>
        </div>
      )}

      {/* ── Record mode ───────────────────────────────────────────────────────── */}
      {inputMode === "record" && (
        <div className="space-y-4">
          {recordState === "idle" && (
            <button
              onClick={startRecording}
              disabled={queue.length >= MAX_QUEUE}
              className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-xl p-8 text-white/50 hover:text-white/80 hover:border-primary/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="p-3 rounded-full bg-white/5 border border-white/10">
                <Mic className="h-6 w-6" />
              </div>
              <span className="text-sm">Click to start recording</span>
              <span className="text-xs text-white/30">Max 5 minutes · one recording at a time</span>
            </button>
          )}

          {recordState === "recording" && (
            <div className="flex flex-col items-center gap-4 p-6 border border-red-500/30 rounded-xl bg-red-500/5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-red-400 font-medium">Recording in progress...</span>
              </div>
              <Button
                onClick={stopRecording}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            </div>
          )}

          {recordState === "stopped" && recordingPreviewUrl && (
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Recording preview</span>
                <button
                  onClick={resetRecording}
                  className="text-white/40 hover:text-white transition-colors flex items-center gap-1 text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  Re-record
                </button>
              </div>
              <audio controls src={recordingPreviewUrl} className="w-full" />
              <Button
                onClick={addRecordingToQueue}
                disabled={queue.length >= MAX_QUEUE}
                size="sm"
                className="w-full bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add to Queue
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Queue summary banner ─────────────────────────────────────────────── */}
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

      {/* ── Queue item list ──────────────────────────────────────────────────── */}
      {queue.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {queue.map(item => (
            <div
              key={item.id}
              className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2"
            >
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

              {/* Audio preview */}
              <audio controls src={item.previewUrl} className="w-full h-8" />
            </div>
          ))}
        </div>
      )}

      {/* ── Picker / queue warning ───────────────────────────────────────────── */}
      {pickerError && (
        <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {pickerError}
        </div>
      )}

      {/* ── Upload All button ────────────────────────────────────────────────── */}
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
  )
}
