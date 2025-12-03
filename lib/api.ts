//lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

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

// Generic API call handler
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const defaultOptions: RequestInit = {
    credentials: 'include', // ✅ ADD THIS - Essential for cookies/sessions
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
//------------ Auth API's  ------------------------------
//-------------------------------------------------------
export const getUserProfile = async (): Promise<any> => {
  return await apiCall("/api/auth/profile", {
    method: "GET",
  })
}

export const signup = async (name: string, email: string, password: string): Promise<AuthResponseData> => {
  return await apiCall<AuthResponseData>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  })
}

export const login = async (email: string, password: string): Promise<AuthResponseData> => {
  return await apiCall<AuthResponseData>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export const googleSignUp = async (): Promise<AuthResponseData> => {
  return await apiCall<AuthResponseData>("/api/auth/google-signup", {
    method: "POST",
  })
}

export const googleSignIn = async (token: string): Promise<AuthResponseData> => {
  return await apiCall<AuthResponseData>("/api/auth/google-signin", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

export const logout = async (): Promise<AuthResponseData> => {
  return await apiCall<AuthResponseData>("/api/auth/logout", {
    method: "POST",
  })
}

export const verifyEmail = async (token: string): Promise<AuthResponseData> => {
  return await apiCall<AuthResponseData>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

export const forgotPassword = async (email: string): Promise<{ message?: string }> => {
  return await apiCall<{ message?: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export const validateResetToken = async (token: string): Promise<{ email?: string }> => {
  return await apiCall<{ email?: string }>("/api/auth/validate-reset-token", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

export const resetPassword = async (token: string, password: string, confirmPassword: string): Promise<{ message?: string }> => {
  return await apiCall<{ message?: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password, confirmPassword }),
  })
}