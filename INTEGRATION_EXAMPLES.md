// Example: How to use syncUserToBackend in a Sign-Up Component

// ============================================
// Option 1: With Clerk's SignUp Component
// ============================================

'use client'

import { useAuth } from "@clerk/nextjs"
import { useSignUp } from "@clerk/nextjs"
import { useEffect } from "react"
import { syncUserToBackend } from "@/lib/api"

export function SignUpWithSync() {
  const { signUp, setActive } = useSignUp()
  const { getToken } = useAuth()

  // Listen for sign-up completion
  useEffect(() => {
    if (signUp?.status === "complete") {
      // User successfully signed up
      handleSignUpComplete()
    }
  }, [signUp?.status])

  async function handleSignUpComplete() {
    try {
      // Get the created user
      const createdUser = signUp?.createdUserId

      if (!createdUser) {
        throw new Error("No user created")
      }

      // Wait a moment for Clerk to fully register the user
      await new Promise(resolve => setTimeout(resolve, 500))

      // Get fresh user data from Clerk
      const user = await signUp?.createdSessionId

      // Sync to backend/Supabase
      await syncUserToBackend(
        signUp?.emailAddress || "",
        signUp?.firstName || "",
        signUp?.lastName || "",
        getToken
      )

      console.log("✅ User synced to Supabase!")
      
      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("❌ Error syncing user:", error)
      // Don't block sign-up if sync fails
    }
  }

  return (
    <div>
      {/* Your sign-up form here */}
    </div>
  )
}

// ============================================
// Option 2: Custom Sign-Up Form Handler
// ============================================

'use client'

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { syncUserToBackend } from "@/lib/api"

interface SignUpFormData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export function CustomSignUpForm() {
  const { getToken, isLoaded } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSignUp(formData: SignUpFormData) {
    if (!isLoaded) {
      setError("Auth not loaded")
      return
    }

    setLoading(true)
    setError("")

    try {
      // 1. Sign up with Clerk (implementation depends on your form)
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Sign-up failed")
      }

      // 2. Get the token
      const token = await getToken()
      if (!token) {
        throw new Error("Could not get auth token")
      }

      // 3. Sync user to backend/Supabase
      await syncUserToBackend(
        formData.email,
        formData.firstName,
        formData.lastName,
        async () => token
      )

      console.log("✅ User registered and synced!")
      // Redirect
      window.location.href = "/dashboard"
    } catch (err: any) {
      setError(err.message || "Failed to sign up")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      // Extract form data and call handleSignUp
    }}>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {/* Your form fields */}
      <button disabled={loading}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  )
}

// ============================================
// Option 3: Server-Side Call (Advanced)
// ============================================

// server/src/routes/users.ts - Already implemented!

// POST /api/users/sync
// Expects:
// {
//   "email": "user@example.com",
//   "firstName": "John",
//   "lastName": "Doe"
// }
// 
// Headers:
// Authorization: Bearer <clerk_jwt_token>

// ============================================
// Option 4: Sync Existing Users (Migration)
// ============================================

'use client'

import { useAuth } from "@clerk/nextjs"
import { syncUserToBackend } from "@/lib/api"

export async function syncExistingUser() {
  const { getToken, user } = useAuth()

  if (!user) return

  try {
    await syncUserToBackend(
      user.emailAddresses[0].emailAddress,
      user.firstName || "",
      user.lastName || "",
      getToken
    )
    console.log("✅ Existing user synced!")
  } catch (error) {
    console.error("❌ Error syncing existing user:", error)
  }
}

// Call this in a useEffect on page load to migrate existing users:
// useEffect(() => {
//   if (user) syncExistingUser()
// }, [user])

// ============================================
// Option 5: Full Integration Pattern
// ============================================

'use client'

import { useAuth, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { syncUserToBackend } from "@/lib/api"

export function UserSyncWrapper() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user || synced) return

    async function syncUser() {
      try {
        console.log("🔄 Syncing user to Supabase...")
        
        await syncUserToBackend(
          user.emailAddresses[0]?.emailAddress || "",
          user.firstName || "",
          user.lastName || "",
          getToken
        )

        setSynced(true)
        console.log("✅ User synced to Supabase")
      } catch (error) {
        console.error("❌ Sync error:", error)
        // Retry after 5 seconds
        setTimeout(() => setSynced(false), 5000)
      }
    }

    syncUser()
  }, [user, isLoaded, synced, getToken])

  return null // This component doesn't render anything
}

// Use in your root layout:
// <UserSyncWrapper /> {/* Syncs user to Supabase on login */}

// ============================================
// Example API Responses
// ============================================

/*
SUCCESS RESPONSE (200):
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clerk_id": "user_2qB3qK9r3F8G",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2024-12-05T10:30:00.000Z",
    "updated_at": "2024-12-05T10:30:00.000Z"
  }
}

ERROR RESPONSE (400/401/500):
{
  "error": "Email is required" | "Invalid token" | "Internal server error"
}
*/

// ============================================
// Environment Variables Needed
// ============================================

/*
Frontend (.env.local):
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:5000

Backend (server/.env):
CLERK_SECRET_KEY=sk_test_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
PORT=5000
*/
