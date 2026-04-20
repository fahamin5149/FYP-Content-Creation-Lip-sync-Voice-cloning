"use client"

import { useCallback, useEffect, useState } from "react"
import { getUserAudio, type MediaItem } from "@/lib/api"
import { VoiceSection } from "./VoiceSection"
import { MediaList } from "./MediaList"

interface VoiceTabProps {
  getToken: () => Promise<string | null>
}

export function VoiceTab({ getToken }: VoiceTabProps) {
  const [englishItems, setEnglishItems] = useState<MediaItem[]>([])
  const [urduItems, setUrduItems] = useState<MediaItem[]>([])
  const [loadingEnglish, setLoadingEnglish] = useState(true)
  const [loadingUrdu, setLoadingUrdu] = useState(true)

  const fetchEnglish = useCallback(async () => {
    setLoadingEnglish(true)
    try {
      const res = await getUserAudio("english", getToken)
      setEnglishItems(res.data ?? [])
    } catch {
      setEnglishItems([])
    } finally {
      setLoadingEnglish(false)
    }
  }, [getToken])

  const fetchUrdu = useCallback(async () => {
    setLoadingUrdu(true)
    try {
      const res = await getUserAudio("urdu", getToken)
      setUrduItems(res.data ?? [])
    } catch {
      setUrduItems([])
    } finally {
      setLoadingUrdu(false)
    }
  }, [getToken])

  useEffect(() => {
    // Fetch both in parallel on mount
    fetchEnglish()
    fetchUrdu()
  }, [fetchEnglish, fetchUrdu])

  const handleDeleteEnglish = (id: string) =>
    setEnglishItems((prev) => prev.filter((i) => i.id !== id))

  const handleDeleteUrdu = (id: string) =>
    setUrduItems((prev) => prev.filter((i) => i.id !== id))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ── English ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <VoiceSection
          language="english"
          existingUploadedCount={englishItems.length}
          onUploadSuccess={fetchEnglish}
          getToken={getToken}
        />
        <MediaList
          items={englishItems}
          type="audio"
          isLoading={loadingEnglish}
          onDelete={handleDeleteEnglish}
          label="Uploaded English Samples"
          getToken={getToken}
        />
      </div>

      {/* ── Urdu ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <VoiceSection
          language="urdu"
          existingUploadedCount={urduItems.length}
          onUploadSuccess={fetchUrdu}
          getToken={getToken}
        />
        <MediaList
          items={urduItems}
          type="audio"
          isLoading={loadingUrdu}
          onDelete={handleDeleteUrdu}
          label="Uploaded Urdu Samples"
          getToken={getToken}
        />
      </div>
    </div>
  )
}
