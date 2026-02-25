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