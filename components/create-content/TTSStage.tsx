"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  getUserAudio,
  generateTTS,
  getTTSOutputBlobUrl,
  getExistingTTSJob,
  MediaItem,
} from "@/lib/api"
import { useMediaBlob } from "@/hooks/useMediaBlob"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Music,
  Volume2,
  Download,
  RotateCcw,
  ArrowRight,
  Mic2,
  Clock,
  Sparkles,
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from "lucide-react"

// ── Types ───────────────────────────────────────────────────────────────────

interface TTSStageProps {
  script: string
  language: string
  scriptId: string
  getToken: () => Promise<string | null>
  onComplete: (jobId: string) => void
  onBack: () => void
}

type Step = "checking" | "select" | "generating" | "result"

// ── Rotating status messages for the generating step ────────────────────────

const STATUS_PHASES = [
  { at: 0, message: "Preparing reference audio…" },
  { at: 5000, message: "Analyzing voice characteristics…" },
  { at: 15000, message: "Synthesizing speech…" },
  { at: 35000, message: "Finalizing output…" },
  { at: 60000, message: "Almost there — xtts_v2 is working hard…" },
]

// ── Waveform visualizer — deterministic bar geometry ────────────────────────
const BAR_COUNT = 60
const BAR_SEEDS = Array.from({ length: BAR_COUNT }, (_, i) => ({
  base:      8  + Math.abs(Math.sin(i * 0.71 + 0.3))  * 34 + Math.abs(Math.cos(i * 0.41 + 1.2)) * 12,
  amplitude: 5  + Math.abs(Math.sin(i * 1.13 + 0.5))  * 14,
  freq:      0.9 + (i % 7) * 0.17,
  phase:     i  * 0.43,
}))

const formatTime = (secs: number) => {
  if (!isFinite(secs) || secs < 0) return "0:00"
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

// ── Sub-component: single audio preview card ────────────────────────────────

function AudioCard({
  item,
  selected,
  onToggle,
  getToken,
}: {
  item: MediaItem
  selected: boolean
  onToggle: () => void
  getToken: () => Promise<string | null>
}) {
  const { blobUrl, loading } = useMediaBlob(item.id, getToken)

  const sizeLabel = item.size_bytes
    ? `${(item.size_bytes / 1024).toFixed(0)} KB`
    : ""

  return (
    <label
      className={`
        group relative flex items-center gap-3 rounded-xl border p-3 text-left cursor-pointer
        transition-all duration-200
        ${
          selected
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
        }
      `}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary cursor-pointer"
        />
      </div>

      {/* Icon */}
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg
          ${selected ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60"}
        `}
      >
        <Music className="h-5 w-5" />
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-white">{item.filename}</p>
        <p className="text-xs text-white/50">{sizeLabel}</p>
      </div>

      {/* Inline audio preview */}
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-white/40" />
      ) : blobUrl ? (
        <audio
          src={blobUrl}
          controls
          controlsList="nodownload noplaybackrate"
          className="h-8 w-36 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : null}
    </label>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function TTSStage({
  script,
  language,
  scriptId,
  getToken,
  onComplete,
  onBack,
}: TTSStageProps) {
  // ─ State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("checking")
  const [audioItems, setAudioItems] = useState<MediaItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Generating step
  const [statusMsg, setStatusMsg] = useState(STATUS_PHASES[0].message)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  // Result step
  const [jobId, setJobId] = useState<string | null>(null)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null)
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null)
  const [loadingResult, setLoadingResult] = useState(false)
  const [isRestored, setIsRestored] = useState(false)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  // Visualizer / custom player
  const audioRef    = useRef<HTMLAudioElement>(null)
  const rafRef      = useRef<number | null>(null)
  const startTsRef  = useRef<number | null>(null)
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [barHeights, setBarHeights]     = useState<number[]>(() => BAR_SEEDS.map((b) => b.base))

  // ─ Check for existing completed TTS job on mount ──────────────────────
  useEffect(() => {
    let cancelled = false
    const checkExisting = async () => {
      try {
        const result = await getExistingTTSJob(scriptId, getToken)
        if (cancelled) return
        if (result.exists && result.data) {
          setJobId(result.data.id)
          setDurationSeconds(result.data.duration_seconds)
          setGeneratedAt(result.data.created_at)
          setIsRestored(true)
          setLoadingResult(true)
          setStep("result")
          const blobUrl = await getTTSOutputBlobUrl(result.data.id, getToken)
          if (!cancelled) {
            setResultBlobUrl(blobUrl)
            setLoadingResult(false)
          }
        } else {
          if (!cancelled) setStep("select")
        }
      } catch {
        if (!cancelled) setStep("select")
      }
    }
    checkExisting()
    return () => { cancelled = true }
  }, [scriptId])

  // ─ Fetch user's audio samples on mount ────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const fetchSamples = async () => {
      setLoadingItems(true)
      setError(null)
      try {
        const res = await getUserAudio(
          language.toLowerCase() as "english" | "urdu",
          getToken
        )
        if (!cancelled) {
          setAudioItems(res.data || [])
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load audio samples")
      } finally {
        if (!cancelled) setLoadingItems(false)
      }
    }
    fetchSamples()
    return () => {
      cancelled = true
    }
  }, [language])

  // ─ Cleanup result blob url on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
    }
  }, [resultBlobUrl])

  // ─ Reset player when audio source changes ─────────────────────────────
  useEffect(() => {
    setCurrentTime(0)
    setIsPlaying(false)
    setAudioDuration(0)
    setBarHeights(BAR_SEEDS.map((b) => b.base))
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
  }, [resultBlobUrl])

  // ─ RAF waveform animation (runs only while playing) ─────────────────
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }
    startTsRef.current = null
    const animate = (ts: number) => {
      if (startTsRef.current === null) startTsRef.current = ts
      const elapsed = (ts - startTsRef.current) / 1000
      setBarHeights(
        BAR_SEEDS.map((b) =>
          b.base + Math.sin(elapsed * b.freq * Math.PI * 2 + b.phase) * b.amplitude
        )
      )
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [isPlaying])

  // ─ Helpers ────────────────────────────────────────────────────────────
  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (selectedIds.size === audioItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(audioItems.map((a) => a.id)))
    }
  }, [audioItems, selectedIds])

  const allSelected = useMemo(
    () => audioItems.length > 0 && selectedIds.size === audioItems.length,
    [audioItems, selectedIds]
  )

  // ─ Generate ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setError(null)
    setStep("generating")

    // Start rotating status messages
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setStatusMsg(STATUS_PHASES[0].message)
    STATUS_PHASES.forEach(({ at, message }) => {
      if (at > 0) {
        const t = setTimeout(() => setStatusMsg(message), at)
        timersRef.current.push(t)
      }
    })

    try {
      const res = await generateTTS(
        {
          scriptId,
          text: script,
          language: language.toLowerCase() === "urdu" ? "ur" : "en",
          mediaIds: Array.from(selectedIds),
        },
        getToken
      )

      setJobId(res.jobId)
      setDurationSeconds(res.durationSeconds)
      setGeneratedAt(new Date().toISOString())

      // Fetch the generated audio as a blob
      setLoadingResult(true)
      const blobUrl = await getTTSOutputBlobUrl(res.jobId, getToken)
      setResultBlobUrl(blobUrl)
      setLoadingResult(false)
      setStep("result")
    } catch (err: any) {
      setError(err.message || "Voice synthesis failed. Please try again.")
      setStep("select")
    } finally {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }

  // ─ Retry ──────────────────────────────────────────────────────────────
  const handleRetry = () => {
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
    setResultBlobUrl(null)
    setJobId(null)
    setDurationSeconds(null)
    setError(null)
    setIsRestored(false)
    setGeneratedAt(null)
    setStep("select")
  }

  // ─ Download helper ────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!resultBlobUrl) return
    const a = document.createElement("a")
    a.href = resultBlobUrl
    a.download = `tts_output_${jobId || "audio"}.wav`
    a.click()
  }

  // ─ Player controls ────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
  }, [isPlaying])

  const handleSeek = useCallback((ratio: number) => {
    if (!audioRef.current || !audioDuration) return
    const t = Math.max(0, Math.min(audioDuration, ratio * audioDuration))
    audioRef.current.currentTime = t
    setCurrentTime(t)
  }, [audioDuration])

  const handleSkipBack = useCallback(() => {
    if (!audioRef.current) return
    const t = Math.max(0, audioRef.current.currentTime - 10)
    audioRef.current.currentTime = t
    setCurrentTime(t)
  }, [])

  const handleSkipForward = useCallback(() => {
    if (!audioRef.current) return
    const t = Math.min(audioDuration, audioRef.current.currentTime + 10)
    audioRef.current.currentTime = t
    setCurrentTime(t)
  }, [audioDuration])

  // =====================================================================
  // RENDER
  // =====================================================================

  // ── Step: CHECKING for existing job ───────────────────────────────────
  if (step === "checking") {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-white/60 text-sm">Checking for previous voice generation…</p>
        </CardContent>
      </Card>
    )
  }

  // ── Step: SELECT reference audio ──────────────────────────────────────
  if (step === "select") {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Volume2 className="h-6 w-6 text-primary" />
              Text-to-Speech
            </CardTitle>
            <CardDescription className="text-white/70">
              Select your reference voice samples for cloning. The more samples you provide,
              the better the cloned voice quality.
            </CardDescription>
          </div>
          <Badge className="bg-primary/20 text-primary self-start">{language}</Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Loading state */}
          {loadingItems ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-white/60 text-sm">Loading your voice samples…</p>
            </div>
          ) : audioItems.length === 0 ? (
            /* Empty state */
            <div className="rounded-xl border border-dashed border-white/15 bg-black/30 px-6 py-10 text-center">
              <Music className="h-10 w-10 mx-auto text-white/30 mb-3" />
              <p className="text-white/70 mb-1">
                No {language.toLowerCase()} reference samples found.
              </p>
              <p className="text-white/50 text-sm">
                Go to <span className="text-primary font-medium">Setup → Voice</span> to upload
                audio samples first.
              </p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/60">
                  {selectedIds.size} of {audioItems.length} selected
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={selectAll}
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </Button>
              </div>

              {/* Audio grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {audioItems.map((item) => (
                  <AudioCard
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggle={() => toggleId(item.id)}
                    getToken={getToken}
                  />
                ))}
              </div>
            </>
          )}

          {/* Script preview */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wide text-white/40 mb-2">
              Script to synthesize
            </p>
            <p className="text-sm text-white/80 line-clamp-4 whitespace-pre-wrap">
              {script}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-3 px-6">
          <Button
            variant="secondary"
            className="bg-slate-500/20 text-slate-300 border border-slate-500/30 hover:bg-slate-500/30 hover:text-slate-200"
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
            disabled={selectedIds.size === 0}
            onClick={handleGenerate}
          >
            Generate Voice
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // ── Step: GENERATING (animated loader) ────────────────────────────────
  if (step === "generating") {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-6">
          {/* Animated rings */}
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-primary/20 animate-ping absolute" />
            <div className="h-20 w-20 rounded-full border-4 border-t-primary border-primary/10 animate-spin" />
            <Volume2 className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-xl font-semibold text-white">Cloning voice…</h3>
            <p className="text-white/60 text-sm animate-pulse">{statusMsg}</p>
            <p className="text-white/40 text-xs mt-4">
              This may take 30–90 seconds depending on script length
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Step: RESULT ──────────────────────────────────────────────────────
  const playProgress = audioDuration > 0 ? currentTime / audioDuration : 0

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between pb-2">
        <div>
          <CardTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            Voice Generated
          </CardTitle>
          <CardDescription className="text-white/70 mt-1">
            {isRestored
              ? "Loaded from your previous generation — skip ahead or regenerate with different samples."
              : "Your cloned voice is ready. Preview it below, then continue to video."}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {isRestored && (
            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 self-start flex items-center gap-1">
              <History className="h-3 w-3" />
              Restored
            </Badge>
          )}
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start">
            Completed
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-2">

        {/* ═══════════════════════════════════════════════════════════════
            iPhone-style Audio Visualizer Player
        ════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-[#111113] border border-white/[0.07] shadow-2xl shadow-black/60">

          {/* Ambient glow blobs */}
          <div className="pointer-events-none absolute -top-12 -left-12 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-primary/15 blur-3xl" />

          {/* ── Track info row ── */}
          <div className="relative flex items-center gap-4 px-5 pt-5 pb-4">
            {/* Artwork */}
            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/30 shadow-lg shadow-primary/30">
              <Mic2 className="h-7 w-7 text-white" />
              {isPlaying && (
                <span className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-[15px] font-semibold text-white">Cloned Voice Output</p>
              <p className="mt-0.5 text-xs text-white/45">
                xtts_v2 · {language}
                {audioDuration > 0 && ` · ${formatTime(audioDuration)}`}
              </p>
            </div>

            {isRestored && (
              <div title="Restored from previous run">
                <History className="h-4 w-4 text-blue-400 flex-shrink-0" />
              </div>
            )}
          </div>

          {/* ── Waveform visualizer ── */}
          {loadingResult ? (
            <div className="flex items-center justify-center gap-3 px-5 py-8 text-white/50 text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading audio…
            </div>
          ) : (
            <div className="px-5 pt-1 pb-0">
              {/* Bars — click anywhere to seek */}
              <div
                className="flex cursor-pointer select-none items-center gap-[1.5px]"
                style={{ height: 80 }}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  handleSeek((e.clientX - r.left) / r.width)
                }}
              >
                {BAR_SEEDS.map((_, i) => {
                  const played = playProgress > 0 && i / BAR_COUNT <= playProgress
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-full"
                      style={{
                        height: `${Math.round(barHeights[i])}px`,
                        background: played
                          ? "hsl(var(--primary))"
                          : "rgba(255,255,255,0.15)",
                        transition: isPlaying ? "none" : "height 0.25s ease, background 0.15s",
                      }}
                    />
                  )
                })}
              </div>

              {/* Time markers */}
              <div className="flex justify-between px-0.5 pb-3 pt-1.5 text-[10px] text-white/30">
                <span>{formatTime(currentTime)}</span>
                <span>−{formatTime(Math.max(0, audioDuration - currentTime))}</span>
              </div>
            </div>
          )}

          {/* ── Playback controls ── */}
          <div className="flex items-center justify-center gap-10 px-5 pb-6 pt-1">
            {/* Skip back 10 s */}
            <button
              className="group flex h-10 w-10 items-center justify-center rounded-full text-white/40 transition-all hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-30"
              onClick={handleSkipBack}
              disabled={!resultBlobUrl || loadingResult}
              title="Back 10 s"
            >
              <SkipBack className="h-6 w-6 fill-current" />
            </button>

            {/* Play / Pause (big iOS-style white circle) */}
            <button
              className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white text-black shadow-2xl shadow-primary/20 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              onClick={togglePlay}
              disabled={!resultBlobUrl || loadingResult}
            >
              {loadingResult ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-7 w-7 fill-black stroke-none" />
              ) : (
                <Play className="h-7 w-7 fill-black stroke-none ml-0.5" />
              )}
            </button>

            {/* Skip forward 10 s */}
            <button
              className="group flex h-10 w-10 items-center justify-center rounded-full text-white/40 transition-all hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-30"
              onClick={handleSkipForward}
              disabled={!resultBlobUrl || loadingResult}
              title="Forward 10 s"
            >
              <SkipForward className="h-6 w-6 fill-current" />
            </button>
          </div>

          {/* Hidden audio element (we drive it ourselves) */}
          <audio
            ref={audioRef}
            src={resultBlobUrl || undefined}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration ?? 0)}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>

        {/* ── Metadata row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {durationSeconds != null && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wide">Duration</p>
                <p className="text-sm font-semibold text-white">{durationSeconds.toFixed(1)}s</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <Mic2 className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide">Samples</p>
              <p className="text-sm font-semibold text-white">
                {isRestored ? "From saved job" : `${selectedIds.size} file${selectedIds.size !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          {generatedAt && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 col-span-2 md:col-span-1">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wide">Generated</p>
                <p className="text-sm font-semibold text-white">
                  {new Date(generatedAt).toLocaleDateString(undefined, {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Script preview ── */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-white/40 mb-2 flex items-center gap-1.5">
            <Volume2 className="h-3 w-3" />
            Script synthesized
          </p>
          <p className="text-sm text-white/70 line-clamp-3 whitespace-pre-wrap leading-relaxed">
            {script}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-3 justify-between px-6 pt-2">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 hover:text-amber-300"
            onClick={handleRetry}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 hover:text-blue-300"
            onClick={handleDownload}
            disabled={!resultBlobUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
        <Button
          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
          onClick={() => jobId && onComplete(jobId)}
          disabled={!jobId || loadingResult}
        >
          Use This Voice & Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  )
}
