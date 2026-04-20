"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Clapperboard, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getLipSyncOutputs, type LipSyncOutputItem } from "@/lib/api"
import { GeneratedVideoCard } from "@/components/dashboard/GeneratedVideoCard"

export function MyVideosContent() {
  const { getToken } = useAuth()

  const [generated, setGenerated] = useState<LipSyncOutputItem[]>([])
  const [loadingGenerated, setLoadingGenerated] = useState(true)
  const [generatedError, setGeneratedError] = useState<string | null>(null)

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

  useEffect(() => {
    void loadGenerated()
  }, [loadGenerated])

  return (
    <div className="space-y-10 text-white max-w-4xl mx-auto">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">Library</p>
        <h1 className="text-3xl font-bold mt-1">My videos</h1>
        <p className="text-white/65 mt-2">
          Lip-sync exports from Create content.
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
            <GeneratedVideoCard
              key={item.jobId}
              item={item}
              getToken={getToken}
              onDeleted={() => void loadGenerated()}
            />
          ))}
      </section>
    </div>
  )
}
