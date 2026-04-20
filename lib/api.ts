//lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

//-------------------------------------------------------
//------------ Authentication Functions  ---------------
//-------------------------------------------------------

/**
 * Fetch with Clerk Authentication (Client-side only)
 * Automatically adds Bearer token to Authorization header
 * MUST pass getToken function from useAuth() hook
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  getToken: () => Promise<string | null>
) {
  if (!getToken) {
    throw new Error("getToken function is required. Use useAuth() hook to get it.")
  }

  let token: string | null = null

  try {
    token = await getToken()
    if (!token) {
      throw new Error("No authentication token available")
    }
  } catch (error) {
    console.error("Auth error:", error)
    throw new Error("User not authenticated")
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  }

  const response = await fetch(url, { ...options, headers })

  // Handle redirect on 302
  if (response.status === 302) {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
    return
  }

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json()
}

//-------------------------------------------------------
//------------ Generic API call handler  ---------------
//-------------------------------------------------------

// Generic API call handler without auth (for public endpoints)
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const defaultOptions: RequestInit = {
    credentials: "include", // Essential for cookies/sessions
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    })

    const data: ApiResponse<T> = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`)
    }

    return data.data as T
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch from API")
  }
}

//-------------------------------------------------------
//------------ Supabase Sync Functions  ----------------
//-------------------------------------------------------

/**
 * Sync user to backend (which stores in Supabase)
 * Call this on sign-up completion
 * MUST pass getToken from useAuth() hook
 */
export const syncUserToBackend = async (
  email: string,
  firstName: string | undefined,
  lastName: string | undefined,
  getToken: () => Promise<string | null>
): Promise<any> => {
  if (!getToken) {
    throw new Error("getToken is required. Use: const { getToken } = useAuth()")
  }

  try {
    const response = await fetchWithAuth(
      `${API_URL}/api/users/sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          firstName: firstName || "",
          lastName: lastName || "",
        }),
      },
      getToken
    )
    return response
  } catch (error) {
    console.error("Error syncing user to backend:", error)
    throw error
  }
}

//-------------------------------------------------------
//------------ Content Creation API Functions ----------
//-------------------------------------------------------

export interface ScriptGenerationParams {
  title: string
  language: string
  topic: string
  scriptType: string
  tone: string
  targetAudience: string
  keyPoints?: string
  duration: number
  pacing: string
  introStyle?: string
  includeHook?: boolean
  includeCTA?: boolean
  includeTransitions?: boolean
  includeQuestions?: boolean
  specialRequirements?: string
  /** Server enforces exactly 1 sentence (prompt + post-trim). */
  generateExactlyOneSentence?: boolean
}

export interface ScriptRefinementParams {
  title: string
  originalScript: string
  refinementType: 'simple' | 'custom'
  customInstructions?: string
  language: string
  duration: number
  pacing: string
}

export interface ScriptFeedbackParams {
  scriptId: string
  currentScript: string
  feedback: string
  language: string
  duration: number
  pacing: string
}

export interface ScriptPassthroughParams {
  title: string
  language: string
  content: string
}

export interface ScriptResponse {
  scriptId: string
  content: string
  metadata: {
    wordCount: number
    estimatedDuration: number
    scriptType?: string
    tone?: string
  }
  version?: number
}

/**
 * Generate AI script from user requirements
 * Requires authentication
 */
export const generateScript = async (
  params: ScriptGenerationParams,
  getToken: () => Promise<string | null>
): Promise<ScriptResponse> => {
  return await fetchWithAuth(
    `${API_URL}/api/content/generate-script`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    },
    getToken
  )
}

/**
 * Refine existing script (simple or custom refinement)
 * Requires authentication
 */
export const refineScript = async (
  params: ScriptRefinementParams,
  getToken: () => Promise<string | null>
): Promise<ScriptResponse> => {
  return await fetchWithAuth(
    `${API_URL}/api/content/refine-script`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    },
    getToken
  )
}

/**
 * Refine script based on user feedback
 * Requires authentication
 */
export const refineWithFeedback = async (
  params: ScriptFeedbackParams,
  getToken: () => Promise<string | null>
): Promise<ScriptResponse> => {
  return await fetchWithAuth(
    `${API_URL}/api/content/refine-with-feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    },
    getToken
  )
}

/**
 * Get script by ID
 * Requires authentication
 */
export const getScript = async (
  scriptId: string,
  getToken: () => Promise<string | null>
): Promise<any> => {
  return await fetchWithAuth(
    `${API_URL}/api/content/script/${scriptId}`,
    {
      method: "GET",
    },
    getToken
  )
}

/**
 * Alias for getScript - Get script by ID
 * Requires authentication
 */
export const getScriptById = getScript

/**
 * Save script as draft
 * Requires authentication
 */
export const saveDraft = async (
  scriptId: string,
  content: string,
  parameters: any,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; draftId: string }> => {
  return await fetchWithAuth(
    `${API_URL}/api/content/save-draft`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scriptId, content, parameters }),
    },
    getToken
  )
}

/**
 * Get user's saved drafts
 * Requires authentication
 */
export const getUserDrafts = async (
  getToken: () => Promise<string | null>
): Promise<{ drafts: any[] }> => {
  return await fetchWithAuth(
    `${API_URL}/api/content/drafts`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    getToken
  )
}

/**
 * Delete a saved draft by script id
 */
export const deleteDraft = async (
  scriptId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean }> => {
  return await fetchWithAuth(
    `${API_URL}/api/content/draft/${encodeURIComponent(scriptId)}`,
    { method: "DELETE" },
    getToken
  )
}

/**
 * Save script directly without AI processing (passthrough)
 * Requires authentication
 */
export const saveScriptDirectly = async (
  params: ScriptPassthroughParams,
  getToken: () => Promise<string | null>
): Promise<ScriptResponse> => {
  return await fetchWithAuth(
    `${API_URL}/api/content/save-script-direct`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    },
    getToken
  )
}

//-------------------------------------------------------
//------------ Media (Voice & Video Setup) API ---------
//-------------------------------------------------------

export interface MediaItem {
  id: string
  clerk_id: string
  media_type: 'audio' | 'video'
  language: 'english' | 'urdu' | null
  filename: string
  file_path: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
  updated_at: string
}

/**
 * Upload an audio sample (english or urdu)
 * Pass FormData with fields: file (Blob/File), language ('english'|'urdu')
 * Do NOT set Content-Type header — browser sets it with the multipart boundary
 */
export const uploadAudio = async (
  formData: FormData,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; data: MediaItem }> =>
  fetchWithAuth(`${API_URL}/api/media/audio`, { method: 'POST', body: formData }, getToken)

/**
 * Upload a video sample
 * Pass FormData with field: file (File)
 */
export const uploadVideo = async (
  formData: FormData,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; data: MediaItem }> =>
  fetchWithAuth(`${API_URL}/api/media/video`, { method: 'POST', body: formData }, getToken)

/**
 * Get user's audio samples, optionally filtered by language
 */
export const getUserAudio = async (
  language: 'english' | 'urdu',
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; data: MediaItem[] }> =>
  fetchWithAuth(`${API_URL}/api/media/audio?language=${language}`, { method: 'GET' }, getToken)

/**
 * Get user's video samples
 */
export const getUserVideo = async (
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; data: MediaItem[] }> =>
  fetchWithAuth(`${API_URL}/api/media/video`, { method: 'GET' }, getToken)

/**
 * Delete a media item by id
 */
export const deleteMediaItem = async (
  id: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean }> =>
  fetchWithAuth(`${API_URL}/api/media/${id}`, { method: 'DELETE' }, getToken)

/**
 * Returns the authenticated streaming URL for a media file.
 * NOTE: HTML <audio>/<video> elements cannot send Authorization headers.
 * Use the useMediaBlob() hook instead, which fetches as a Blob and returns
 * a local object URL that can be safely used as an src attribute.
 */
export const getMediaStreamUrl = (id: string): string =>
  `${API_URL}/api/media/file/${id}`

//-------------------------------------------------------
//------------ TTS (Voice Cloning) API -----------------
//-------------------------------------------------------

export interface TTSRequest {
  scriptId: string
  text: string
  language: string
  mediaIds: string[]
}

export interface TTSResponse {
  success: boolean
  jobId: string
  durationSeconds: number
  message: string
}

export interface ExistingTTSJob {
  id: string
  status: string
  output_audio_path: string
  duration_seconds: number | null
  created_at: string
  input_media_ids: string[]
}

/**
 * Check if a completed TTS job already exists for this script on disk.
 * Returns { exists: false } if none found or the file has been deleted.
 */
export const getExistingTTSJob = async (
  scriptId: string,
  getToken: () => Promise<string | null>
): Promise<{ exists: boolean; data?: ExistingTTSJob }> => {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}/api/tts/jobs/by-script/${scriptId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 404) return { exists: false }
  if (!res.ok) return { exists: false }

  return res.json()
}

// ── Urdu TTS request type ────────────────────────────────────────────────────
export interface UrduTTSRequest {
  scriptId: string
  text: string
  mediaIds: string[]
  stylePreset: string
}

/**
 * Trigger Urdu voice cloning via the two-stage pipeline.
 * Calls the Next.js API route which orchestrates:
 *   Node.js (job create + path resolve) → FastAPI :8001 (Parler-TTS + OpenVoice V2) → Node.js (job update)
 */
export const generateUrduTTS = async (
  params: UrduTTSRequest,
  getToken: () => Promise<string | null>
): Promise<TTSResponse> => {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch('/api/process/urdu-tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Urdu TTS generation failed')
  return data
}

/**
 * Trigger English voice cloning via the TTS pipeline.
 * Calls the Next.js API route which orchestrates:
 *   Node.js (job create + path resolve) → FastAPI (xtts_v2) → Node.js (job update)
 */
export const generateTTS = async (
  params: TTSRequest,
  getToken: () => Promise<string | null>
): Promise<TTSResponse> => {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch('/api/process/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'TTS generation failed')
  return data
}

/**
 * Stream the generated TTS output as a Blob URL.
 * Uses the Node.js backend streaming endpoint (same pattern as useMediaBlob).
 */
export const getTTSOutputBlobUrl = async (
  jobId: string,
  getToken: () => Promise<string | null>
): Promise<string> => {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}/api/tts/output/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch TTS output')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

/**
 * Get the absolute output WAV disk path for a completed TTS job.
 * Used by downstream services (e.g., lip-sync) that require filesystem paths.
 */
export const getTTSOutputPath = async (
  jobId: string,
  getToken: () => Promise<string | null>
): Promise<string> => {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}/api/tts/output-path/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data?.detail || 'Failed to fetch TTS output path')
  return data.data.outputAudioPath
}

/**
 * Resolve an uploaded media item's absolute disk path.
 * Useful when the frontend needs to pass real file paths to AI microservices.
 */
export const resolveMediaPath = async (
  mediaId: string,
  mediaType: 'audio' | 'video',
  getToken: () => Promise<string | null>
): Promise<{ absolutePath: string }> => {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}/api/media/resolve-path`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mediaId, mediaType }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data?.detail || 'Failed to resolve media path')
  return data.data
}

export interface LipSyncOutputItem {
  jobId: string
  size_bytes: number
  created_at: string
}

/**
 * List generated lip-sync MP4s for the current user (LIPSYNC_Output on disk).
 */
export const getLipSyncOutputs = async (
  getToken: () => Promise<string | null>
): Promise<LipSyncOutputItem[]> => {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}/api/lipsync/outputs`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  let data: { error?: string; detail?: string; data?: LipSyncOutputItem[] } = {}
  try {
    data = text ? (JSON.parse(text) as typeof data) : {}
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const hint =
      (typeof data.error === 'string' && data.error) ||
      (typeof data.detail === 'string' && data.detail) ||
      (text && text.length < 400 ? text : null)
    throw new Error(
      hint || `Lip-sync list failed (${res.status} ${res.statusText}). Is the API server on ${API_URL} restarted?`
    )
  }
  return (data.data ?? []) as LipSyncOutputItem[]
}

/**
 * Delete a generated lip-sync MP4 from server storage
 */
export const deleteLipSyncOutput = async (
  jobId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean }> => {
  const token = await getToken()
  if (!token) throw new Error("Not authenticated")

  const res = await fetch(`${API_URL}/api/lipsync/output/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean }
  if (!res.ok) throw new Error(data.error || "Failed to delete video")
  return { success: Boolean(data.success) }
}

/**
 * Stream lip-sync output MP4 and return a local Blob URL.
 */
export const getLipSyncOutputBlobUrl = async (
  jobId: string,
  getToken: () => Promise<string | null>
): Promise<string> => {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}/api/lipsync/output/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch lip-sync output')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export type LipSyncExportFormat = 'mp4' | 'mov' | 'webm'

/**
 * Export lip-sync output to selected format and return a downloadable Blob URL.
 * mp4 streams original output; mov/webm are transcoded server-side.
 */
export const getLipSyncExportBlobUrl = async (
  jobId: string,
  format: LipSyncExportFormat,
  getToken: () => Promise<string | null>
): Promise<string> => {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}/api/lipsync/output/${jobId}/export?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || data.detail || `Failed to export as ${format.toUpperCase()}`)
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

/**
 * Run Wav2Lip via Next.js (calls FastAPI on WAV2LIP_URL). Same-origin only.
 */
export const runLipSyncProcess = async (params: {
  videoPath: string
  audioPath: string
  userId: string
  jobId: string
  syncSettings?: Record<string, unknown>
}): Promise<{ jobId: string }> => {
  const res = await fetch('/api/process/lip-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoPath: params.videoPath,
      audioPath: params.audioPath,
      userId: params.userId,
      jobId: params.jobId,
      syncSettings: { quality: 'medium', ...params.syncSettings },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = [data.error, data.details].filter(Boolean).join(': ') || 'Lip sync failed'
    throw new Error(msg)
  }
  return { jobId: data.jobId as string }
}

export type YouTubePrivacy = "public" | "unlisted" | "private"

export interface YouTubeUploadParams {
  accessToken: string
  videoBlob: Blob
  title: string
  description: string
  privacyStatus: YouTubePrivacy
  onProgress?: (percent: number) => void
}

export interface YouTubeUploadResult {
  id: string
  url: string
}

/**
 * Upload a video directly to YouTube Data API v3 using OAuth2 access token.
 */
export const uploadVideoToYouTube = async ({
  accessToken,
  videoBlob,
  title,
  description,
  privacyStatus,
  onProgress,
}: YouTubeUploadParams): Promise<YouTubeUploadResult> => {
  const metadata = {
    snippet: {
      title,
      description,
    },
    status: {
      privacyStatus,
    },
  }

  const initRes = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
    },
    body: JSON.stringify(metadata),
  })

  if (!initRes.ok) {
    const err = await initRes.text()
    throw new Error(err || "Failed to initialize YouTube upload")
  }

  const uploadUrl = initRes.headers.get("Location")
  if (!uploadUrl) throw new Error("YouTube resumable upload URL was not returned")

  const result = await new Promise<YouTubeUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", "video/mp4")
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const payload = JSON.parse(xhr.responseText || "{}") as { id?: string; error?: { message?: string } }
          if (!payload.id) throw new Error(payload.error?.message || "YouTube upload completed but ID missing")
          resolve({ id: payload.id, url: `https://www.youtube.com/watch?v=${payload.id}` })
        } catch (e) {
          reject(e)
        }
        return
      }
      reject(new Error(xhr.responseText || "YouTube upload failed"))
    }
    xhr.onerror = () => reject(new Error("Network error during YouTube upload"))
    xhr.send(videoBlob)
  })

  return result
}

//-------------------------------------------------------
//------------ Non-Auth API's  -------------------------
//-------------------------------------------------------
// Note: Authentication is now handled by Clerk
// Use this for general API calls to your backend

export const getUserProfile = async (): Promise<any> => {
  return await apiCall("/api/auth/profile", {
    method: "GET",
  })
}