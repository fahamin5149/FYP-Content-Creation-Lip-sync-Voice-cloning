const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface AuthResponseData {
  id?: number
  email: string
  message?: string
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultOptions: RequestInit = {
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

export const api = {
  auth: {
    signup: async (payload: { email: string; password: string }): Promise<AuthResponseData> =>
      apiCall<AuthResponseData>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    login: async (payload: { email: string; password: string }): Promise<AuthResponseData> =>
      apiCall<AuthResponseData>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    googleSignUp: async (): Promise<AuthResponseData> =>
      apiCall<AuthResponseData>("/api/auth/google-signup", {
        method: "POST",
      }),

    logout: async (): Promise<AuthResponseData> =>
      apiCall<AuthResponseData>("/api/auth/logout", {
        method: "POST",
      }),

    verifyEmail: async (token: string): Promise<AuthResponseData> =>
      apiCall<AuthResponseData>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
  },
}