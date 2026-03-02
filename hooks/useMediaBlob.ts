// hooks/useMediaBlob.ts
// HTML <audio>/<video> elements cannot send Authorization headers in their src
// attribute. This hook pre-fetches the file through the authenticated streaming
// endpoint and returns a local Blob URL that can safely be used as src.
// The object URL is revoked on unmount to avoid memory leaks.
// getToken is passed in from the parent component rather than calling useAuth
// here, so this hook can be used without its own Clerk context dependency.

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function useMediaBlob(
  mediaId: string | null,
  getToken: () => Promise<string | null>
) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mediaId) {
      setBlobUrl(null)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    const fetchBlob = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        const response = await fetch(`${API_URL}/api/media/file/${mediaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`Failed to load media: ${response.status}`)
        const blob = await response.blob()
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob)
          setBlobUrl(objectUrl)
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load media')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBlob()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [mediaId])

  return { blobUrl, loading, error }
}
