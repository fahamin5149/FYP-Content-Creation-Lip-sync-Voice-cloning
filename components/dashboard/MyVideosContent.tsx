"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Clapperboard, FileVideo, Loader2, RefreshCw, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MediaList } from "@/components/setup/MediaList"
import { getUserVideo, getLipSyncOutputs, type MediaItem, type LipSyncOutputItem } from "@/lib/api"
import { useLipSyncOutputBlob } from "@/hooks/useLipSyncOutputBlob"

function GeneratedVideoCard({
  item,
  getToken,
}: {
  item: LipSyncOutputItem
  getToken: () => Promise<string | null>
}) {
  const { blobUrl, loading, error } = useLipSyncOutputBlob(item.jobId, getToken)

  const formattedDate = new Date(item.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  const sizeLabel =
    item.size_bytes > 1024 * 1024
      ? `${(item.size_bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(item.size_bytes / 1024).toFixed(0)} KB`

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-primary/15 border border-primary/25 shrink-0">
          <Clapperboard className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white font-mono truncate">{item.jobId}</p>
          <p className="text-xs text-white/40 mt-0.5">
            {formattedDate} · {sizeLabel}
          </p>
        </div>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-white/40 text-xs py-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading preview…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400/70 text-xs">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}
      {blobUrl && (
        <video controls src={blobUrl} className="w-full rounded-lg max-h-56 bg-black" playsInline />
      )}
    </div>
  )
}

export function MyVideosContent() {
  const { getToken } = useAuth()

  const [generated, setGenerated] = useState<LipSyncOutputItem[]>([])
  const [loadingGenerated, setLoadingGenerated] = useState(true)
  const [generatedError, setGeneratedError] = useState<string | null>(null)

  const [uploads, setUploads] = useState<MediaItem[]>([])
  const [loadingUploads, setLoadingUploads] = useState(true)

  const loadGenerated = useCallback(async () => {
    setLoadingGenerated(true)
    setGeneratedError(null)
    try {
      const data = await getLipSyncOutputs(getToken)
      setGenerated(data)
    } catch (e) {
      setGeneratedError(e instanceof Error ? e.message : "Could not load generated videos")
      setGenerated([])
    } finally {
      setLoadingGenerated(false)
    }
  }, [getToken])

  const loadUploads = useCallback(async () => {
    setLoadingUploads(true)
    try {
      const res = await getUserVideo(getToken)
      setUploads(res.data ?? [])
    } catch {
      setUploads([])
    } finally {
      setLoadingUploads(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadGenerated()
  }, [loadGenerated])

  useEffect(() => {
    void loadUploads()
  }, [loadUploads])

  const handleDeleteUpload = async (id: string) => {
    setUploads((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <div className="space-y-10 text-white max-w-4xl mx-auto">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">Library</p>
        <h1 className="text-3xl font-bold mt-1">My videos</h1>
        <p className="text-white/65 mt-2">
          Lip-sync exports from Create content, and source clips you uploaded in Setup.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Generated (lip-sync)</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => void loadGenerated()}
              disabled={loadingGenerated}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingGenerated ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-primary to-primary/80 text-white"
            >
              <Link href="/dashboard/create-content">Create content</Link>
            </Button>
          </div>
        </div>

        {generatedError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {generatedError}
          </div>
        )}

        {loadingGenerated && (
          <div className="flex items-center gap-2 text-white/50 text-sm py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        )}

        {!loadingGenerated && generated.length === 0 && !generatedError && (
          <div className="flex flex-col items-center gap-3 py-10 border border-dashed border-white/15 rounded-xl text-white/45">
            <Clapperboard className="h-10 w-10" />
            <p className="text-sm text-center max-w-sm">
              No lip-sync videos yet. Run the pipeline through{" "}
              <Link href="/dashboard/create-content" className="text-primary hover:underline">
                Create content
              </Link>{" "}
              (TTS → Video).
            </p>
          </div>
        )}

        {!loadingGenerated &&
          generated.length > 0 &&
          generated.map((item) => (
            <GeneratedVideoCard key={item.jobId} item={item} getToken={getToken} />
          ))}
      </section>

      <section className="space-y-4 border-t border-white/10 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileVideo className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Uploaded (face / source clips)</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => void loadUploads()}
            disabled={loadingUploads}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingUploads ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-white/55">
          These are the files stored from{" "}
          <Link href="/dashboard/setup" className="text-primary hover:underline">
            Setup → Video
          </Link>
          . Use them as the face video in the Create content lip-sync step.
        </p>

        <MediaList
          items={uploads}
          type="video"
          onDelete={handleDeleteUpload}
          isLoading={loadingUploads}
          getToken={getToken}
        />
      </section>
    </div>
  )
}
