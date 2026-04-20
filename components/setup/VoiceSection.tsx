"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Mic, Upload, Square, Loader2, CheckCircle, AlertCircle, X, RefreshCw, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  AUDIO_FILE_INPUT_ACCEPT,
  SUPPORTED_AUDIO_FORMATS_LABEL,
  isSupportedAudioFile,
} from "@/lib/audioFormats"
import { getAudioUploadRejectionReason } from "@/lib/mediaUploadGuards"
import { MAX_USER_AUDIOS_PER_LANGUAGE } from "@/lib/mediaLimits"

const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB per file
const MAX_RECORDING_MS = 5 * 60 * 1000        // 5 minutes
const MIN_FILES_TO_UPLOAD = 1                  // minimum files required to proceed
const MIN_AUDIO_SAMPLE_RATE = 16000
const MAX_AUDIO_SAMPLE_RATE = 96000

interface BatchReport {
  acceptedCount: number
  requestedCount: number
  acceptedNames: string[]
  skippedNames: string[]
  message: string
}

interface VoiceSectionProps {
  language: "english" | "urdu"
  /** Samples already saved on the server for this language (cap: MAX_USER_AUDIOS_PER_LANGUAGE). */
  existingUploadedCount: number
  onUploadSuccess: () => void
  getToken: () => Promise<string | null>
}

type InputMode = "record" | "upload"
type RecordState = "idle" | "recording" | "stopped"
type QueueStatus = "pending" | "uploading" | "done" | "error"
type ValidationStatus = "valid" | "invalid"

interface QueueItem {
  id: string
  file: File | Blob
  name: string
  previewUrl: string
  addedAtMs: number
  /** Set when upload to server completes successfully */
  uploadCompletedAtMs?: number
  batchOrder: number
  status: QueueStatus
  progress: number
  validationStatus: ValidationStatus
  validationReason?: string
  errorMsg?: string
}

export function VoiceSection({ language, existingUploadedCount, onUploadSuccess, getToken }: VoiceSectionProps) {
  const [inputMode, setInputMode] = useState<InputMode>("upload")

  // ── Queue state ──────────────────────────────────────────────────────────────
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isUploadingAll, setIsUploadingAll] = useState(false)
  const [pickerError, setPickerError] = useState<string | null>(null)
  const [batchReport, setBatchReport] = useState<BatchReport | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const [uploadBatch, setUploadBatch] = useState<{ done: number; total: number } | null>(null)

  // ── Recording state ──────────────────────────────────────────────────────────
  const [recordState, setRecordState] = useState<RecordState>("idle")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordingCountRef = useRef(0)
  const queueOrderRef = useRef(0)
  const existingCountRef = useRef(existingUploadedCount)
  const queueLimitRef = useRef(queue)
  existingCountRef.current = existingUploadedCount
  queueLimitRef.current = queue

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Derived counts ───────────────────────────────────────────────────────────
  const pendingCount = queue.filter(q => q.status === "pending").length
  const errorCount = queue.filter(q => q.status === "error").length
  const uploadingCount = queue.filter(q => q.status === "uploading").length
  const canUploadAll = pendingCount >= MIN_FILES_TO_UPLOAD && !isUploadingAll
  const sortedQueue = useMemo(
    () =>
      [...queue].sort((a, b) => {
        if (a.addedAtMs !== b.addedAtMs) return a.addedAtMs - b.addedAtMs
        return a.batchOrder - b.batchOrder
      }),
    [queue]
  )

  const queueSlotsReserved = useMemo(
    () => queue.filter((q) => q.status === "pending" || q.status === "uploading").length,
    [queue]
  )

  const slotsRemaining = Math.max(
    0,
    MAX_USER_AUDIOS_PER_LANGUAGE - existingUploadedCount - queueSlotsReserved
  )

  // ── Queue helpers ────────────────────────────────────────────────────────────
  const updateItemStatus = (id: string, status: QueueStatus, errorMsg?: string) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status, errorMsg } : i))
  }
  const updateItemProgress = (id: string, progress: number) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, progress } : i))
  }

  const showToast = (
    type: "info" | "success" | "error",
    message: string
  ) => {
    if (type === "success") {
      return toast.success(message, {
        duration: 4000,
        action: { label: "Close", onClick: () => toast.dismiss() },
      })
    }
    if (type === "error") {
      return toast.error(message, {
        duration: 4000,
        action: { label: "Close", onClick: () => toast.dismiss() },
      })
    }
    return toast.message(message, {
      duration: 4000,
      action: { label: "Close", onClick: () => toast.dismiss() },
    })
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter(i => i.id !== id)
    })
  }

  const updateOverallProgress = (uploadIds: string[]) => {
    setQueue((prev) => {
      const relevant = prev.filter((q) => uploadIds.includes(q.id))
      if (relevant.length === 0) {
        setOverallProgress(0)
      } else {
        const avg = Math.round(relevant.reduce((sum, q) => sum + (q.progress || 0), 0) / relevant.length)
        setOverallProgress(avg)
      }
      return prev
    })
  }

  const enqueueValidatedFile = async (blob: Blob, name: string, batchOrder: number) => {
    const now = Date.now()
    const validation = await validateAudioFile(blob, name)
    const item: QueueItem = {
      id: crypto.randomUUID(),
      file: blob,
      name,
      previewUrl: URL.createObjectURL(blob),
      addedAtMs: now,
      batchOrder,
      status: validation.valid ? "pending" : "error",
      progress: 0,
      validationStatus: validation.valid ? "valid" : "invalid",
      validationReason: validation.reason,
      errorMsg: validation.valid ? undefined : validation.reason,
    }
    setQueue((prev) => [...prev, item])
    return item
  }

  const validateAudioFile = async (blob: Blob, name: string): Promise<{ valid: boolean; reason?: string }> => {
    if (!blob || blob.size <= 0) {
      return { valid: false, reason: "0-byte audio is not allowed." }
    }
    const wrongKind = getAudioUploadRejectionReason({ name, type: blob.type })
    if (wrongKind) {
      return { valid: false, reason: wrongKind }
    }
    if (blob.size > MAX_AUDIO_SIZE_BYTES) {
      return { valid: false, reason: "Exceeds 50 MB limit." }
    }
    if (!isSupportedAudioFile({ name, type: blob.type })) {
      return { valid: false, reason: `Unsupported format. Supported: ${SUPPORTED_AUDIO_FORMATS_LABEL}.` }
    }
    try {
      const AudioCtx =
        typeof window !== "undefined"
          ? (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
          : undefined
      if (!AudioCtx) return { valid: true }
      const audioCtx = new AudioCtx()
      const arr = await blob.arrayBuffer()
      const decoded = await audioCtx.decodeAudioData(arr.slice(0))
      const sampleRate = decoded.sampleRate
      const duration = decoded.duration
      await audioCtx.close()
      if (!Number.isFinite(duration) || duration <= 0) return { valid: false, reason: "Audio duration is invalid." }
      if (sampleRate < MIN_AUDIO_SAMPLE_RATE || sampleRate > MAX_AUDIO_SAMPLE_RATE) {
        return {
          valid: false,
          reason: `Sample rate ${sampleRate}Hz unsupported. Allowed: ${MIN_AUDIO_SAMPLE_RATE}-${MAX_AUDIO_SAMPLE_RATE}Hz.`,
        }
      }
      return { valid: true }
    } catch {
      return { valid: false, reason: "Audio codec not compatible or file is corrupted." }
    }
  }

  const uploadAudioWithProgress = async (
    item: QueueItem,
    onProgress: (pct: number) => void
  ): Promise<void> => {
    const token = await getToken()
    if (!token) throw new Error("Not authenticated")
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    const endpoint = `${API_URL}/api/media/audio`
    const formData = new FormData()
    formData.append("file", item.file, item.name)
    formData.append("language", language)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", endpoint)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)))
        }
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
      xhr.send(formData)
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
      // Permission revoked or device removed mid-session.
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          if (recorder.state === "recording") recorder.stop()
          setPickerError("Microphone permission was revoked. Recording stopped.")
          showToast("error", "Microphone permission revoked. Recording stopped.")
        }
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setRecordState("stopped")
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (blob.size <= 0) {
          setPickerError("Recording captured no audio. Please try again.")
          showToast("error", "Recording stopped with no audio captured.")
          setRecordState("idle")
          return
        }
        const reserved = queueLimitRef.current.filter(
          (q) => q.status === "pending" || q.status === "uploading"
        ).length
        if (existingCountRef.current + reserved >= MAX_USER_AUDIOS_PER_LANGUAGE) {
          const msg = `Recording complete, but you already have ${MAX_USER_AUDIOS_PER_LANGUAGE} ${language} samples (or the queue is full). Delete one below or clear the queue.`
          setPickerError(msg)
          showToast("error", msg)
          setRecordState("idle")
          return
        }
        recordingCountRef.current += 1
        queueOrderRef.current += 1
        const item = await enqueueValidatedFile(blob, `Recording-${recordingCountRef.current}.webm`, queueOrderRef.current)
        if (item.validationStatus === "invalid" && item.validationReason) {
          setPickerError(item.validationReason)
          showToast("error", `Recording added but invalid: ${item.validationReason}`)
        } else {
          showToast("success", "Recording added to upload queue.")
        }
        setRecordState("idle")
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
      showToast("error", "Microphone access denied.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }

  useEffect(() => {
    const handleOffline = () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop()
        setPickerError("Network disconnected while recording. Recording stopped safely.")
        showToast("error", "Network disconnected while recording.")
      }
    }
    window.addEventListener("offline", handleOffline)
    return () => window.removeEventListener("offline", handleOffline)
  }, [])

  // ── File picker handler ──────────────────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPickerError(null)
    setBatchReport(null)

    const remaining = slotsRemaining
    if (remaining <= 0) {
      setPickerError(
        existingUploadedCount >= MAX_USER_AUDIOS_PER_LANGUAGE
          ? `You already have ${MAX_USER_AUDIOS_PER_LANGUAGE} ${language} samples. Delete one in Uploaded below to add more.`
          : "No free slots while uploads are in progress. Wait or remove a pending file."
      )
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const acceptedByLimit = files.slice(0, remaining)
    const overflow = files.slice(remaining)
    const wrongKind = acceptedByLimit.filter((f) => getAudioUploadRejectionReason(f) != null)
    const maybeAudio = acceptedByLimit.filter((f) => getAudioUploadRejectionReason(f) == null)
    const supported = maybeAudio.filter((f) => isSupportedAudioFile(f))
    const unsupported = maybeAudio.filter((f) => !isSupportedAudioFile(f))
    const oversized = supported.filter((f) => f.size > MAX_AUDIO_SIZE_BYTES)
    const valid = supported.filter((f) => f.size <= MAX_AUDIO_SIZE_BYTES)

    let warn = ""
    if (files.length > remaining) warn = `Only ${remaining} slot(s) left in queue. `
    if (wrongKind.length) {
      warn += `${wrongKind.length} file(s) skipped — not audio (use Video setup for video files). `
    }
    if (unsupported.length) warn += `${unsupported.length} file(s) skipped — unsupported format. Supported: ${SUPPORTED_AUDIO_FORMATS_LABEL}. `
    if (oversized.length) warn += `${oversized.length} file(s) skipped — exceeds 50 MB limit.`
    if (warn) setPickerError(warn.trim())
    const skippedNames = [...overflow, ...wrongKind, ...unsupported, ...oversized].map((f) => f.name)
    const acceptedNames = valid.map((f) => f.name)

    setBatchReport({
      acceptedCount: acceptedNames.length,
      requestedCount: files.length,
      acceptedNames,
      skippedNames,
      message: `${acceptedNames.length} of ${files.length} files accepted (max ${MAX_USER_AUDIOS_PER_LANGUAGE} ${language} samples per account).`,
    })

    const baseOrder = queueOrderRef.current + 1
    valid.forEach(async (f, idx) => {
      await enqueueValidatedFile(f, f.name, baseOrder + idx)
    })
    queueOrderRef.current += valid.length
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Upload all ───────────────────────────────────────────────────────────────
  const uploadAll = async () => {
    const toUpload = sortedQueue.filter(i => i.status === "pending" && i.validationStatus === "valid")
    if (toUpload.length < MIN_FILES_TO_UPLOAD) {
      const msg = `At least ${MIN_FILES_TO_UPLOAD} file is required to proceed.`
      setPickerError(msg)
      showToast("error", msg)
      return
    }

    setIsUploadingAll(true)
    setPickerError(null)
    setOverallProgress(0)
    setUploadBatch({ done: 0, total: toUpload.length })
    showToast("info", `Uploading ${toUpload.length} file(s)…`)
    let successCount = 0

    for (let idx = 0; idx < toUpload.length; idx++) {
      const item = toUpload[idx]
      updateItemStatus(item.id, "uploading")
      try {
        await uploadAudioWithProgress(item, (pct) => {
          updateItemProgress(item.id, pct)
          updateOverallProgress(toUpload.map((q) => q.id))
        })
        successCount += 1
        removeFromQueue(item.id)
        updateOverallProgress(toUpload.map((q) => q.id))
      } catch (err: any) {
        const msg = err.message || "Upload failed"
        let friendly = msg
        if (msg.includes("exceeds")) friendly = "Exceeds 50 MB limit."
        else if (msg.toLowerCase().includes("unsupported")) {
          friendly = `Unsupported format. Supported: ${SUPPORTED_AUDIO_FORMATS_LABEL}.`
        }
        updateItemStatus(item.id, "error", friendly)
        updateItemProgress(item.id, 100)
        updateOverallProgress(toUpload.map((q) => q.id))
        showToast("error", `Upload failed for ${item.name}. Reason: ${friendly}.`)
      }
      setUploadBatch({ done: idx + 1, total: toUpload.length })
      setOverallProgress(Math.round(((idx + 1) / toUpload.length) * 100))
    }

    setIsUploadingAll(false)
    setUploadBatch(null)
    if (successCount > 0) {
      showToast("success", `${successCount} file(s) uploaded successfully.`)
      onUploadSuccess()
    }
  }

  // ── Mode switch ──────────────────────────────────────────────────────────────
  const switchMode = (mode: InputMode) => {
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
            accept={AUDIO_FILE_INPUT_ACCEPT}
            multiple
            className="hidden"
            onChange={handleFilePick}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={slotsRemaining <= 0}
            className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-xl p-8 text-white/50 hover:text-white/80 hover:border-white/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm">Click to browse audio files</span>
            <span className="text-xs text-white/30">
              Supported: {SUPPORTED_AUDIO_FORMATS_LABEL}. Max {MAX_USER_AUDIOS_PER_LANGUAGE} {language} samples ({existingUploadedCount} saved
              {queueSlotsReserved > 0 ? ` · ${queueSlotsReserved} uploading/queued` : ""}), max 50MB each, min {MIN_FILES_TO_UPLOAD}{" "}
              required. All uploads are auto-converted to WAV.
            </span>
          </button>
        </div>
      )}

      {/* ── Record mode ───────────────────────────────────────────────────────── */}
      {inputMode === "record" && (
        <div className="space-y-4">
          {recordState === "idle" && (
            <button
              onClick={startRecording}
              disabled={slotsRemaining <= 0}
              className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-xl p-8 text-white/50 hover:text-white/80 hover:border-primary/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="p-3 rounded-full bg-white/5 border border-white/10">
                <Mic className="h-6 w-6" />
              </div>
              <span className="text-sm">Click to start recording</span>
              <span className="text-xs text-white/30">Max 5 minutes · auto-adds to queue when stopped</span>
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
          {recordState === "stopped" && (
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Finalizing recording...</span>
                <RotateCcw className="h-3 w-3 text-white/40 animate-spin" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Queue summary banner ─────────────────────────────────────────────── */}
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

      {batchReport && (
        <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-lg px-3 py-2 space-y-2">
          <p>{batchReport.message}</p>
          <p className="text-white/40">
            Accepted {batchReport.acceptedCount} / Requested {batchReport.requestedCount}
          </p>
          {batchReport.acceptedNames.length > 0 && (
            <p>
              <span className="text-emerald-300">Accepted:</span> {batchReport.acceptedNames.join(", ")}
            </p>
          )}
          {batchReport.skippedNames.length > 0 && (
            <p>
              <span className="text-amber-300">Skipped:</span> {batchReport.skippedNames.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* ── Queue item list ──────────────────────────────────────────────────── */}
      {queue.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {sortedQueue.map(item => (
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
                    Uploading...
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

              {/* Audio preview */}
              <audio controls src={item.previewUrl} className="w-full h-8" />
              {(item.status === "uploading" || item.status === "done" || item.status === "error") && (
                <div className="space-y-1">
                  <Progress value={item.progress} className={item.status === "error" ? "bg-red-950" : ""} />
                  <p className="text-[10px] text-white/40 text-right">{item.progress}%</p>
                </div>
              )}
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
  )
}
