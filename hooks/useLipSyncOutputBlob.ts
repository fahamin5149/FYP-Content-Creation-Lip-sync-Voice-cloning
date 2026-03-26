import { useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

/** Authenticated blob URL for GET /api/lipsync/output/:jobId */
export function useLipSyncOutputBlob(
  jobId: string | null,
  getToken: () => Promise<string | null>
) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) {
      setBlobUrl(null)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/lipsync/output/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Failed to load video: ${res.status}`)
        const blob = await res.blob()
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob)
          setBlobUrl(objectUrl)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [jobId])

  return { blobUrl, loading, error }
}
