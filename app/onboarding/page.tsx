"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { syncUserToBackend } from "@/lib/api"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function OnboardingPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      // Not ready yet or not signed in, redirect to sign-in
      router.push("/sign-in")
      return
    }

    const syncUser = async () => {
      try {
        setStatus("syncing")
        console.log("🔄 Syncing user to Supabase...")

        await syncUserToBackend(
          user.emailAddresses[0]?.emailAddress || "",
          user.firstName || undefined,
          user.lastName || undefined,
          getToken
        )

        console.log("✅ User synced to Supabase successfully!")
        setStatus("success")

        // Wait a moment to show success message, then redirect
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } catch (err: any) {
        console.error("❌ Failed to sync user:", err)
        setError(err.message || "Failed to sync user data")
        setStatus("error")

        // Even if sync fails, redirect after 3 seconds (user is still in Clerk)
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      }
    }

    syncUser()
  }, [isLoaded, isSignedIn, user, getToken, router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 text-center"
        >
          {/* Logo/Brand */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              Urdu AI <span className="text-[#e78a53]">Video Creator</span>
            </h1>
          </div>

          {/* Status Messages */}
          {status === "syncing" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg
                    className="animate-spin text-[#e78a53]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-white mb-2">
                Setting up your account...
              </h2>
              <p className="text-zinc-400">
                We're preparing your workspace. This will only take a moment.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-white mb-2">
                Welcome aboard! 🎉
              </h2>
              <p className="text-zinc-400">
                Your account is ready. Redirecting to dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-white mb-2">
                Almost there...
              </h2>
              <p className="text-zinc-400 mb-2">
                We'll complete the setup later. Taking you to your dashboard...
              </p>
              {error && (
                <p className="text-xs text-zinc-500 mt-2">
                  ({error})
                </p>
              )}
            </>
          )}

          {/* Progress Indicator */}
          <div className="mt-8">
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <motion.div
                className="bg-[#e78a53] h-1.5 rounded-full"
                initial={{ width: "0%" }}
                animate={{
                  width: status === "syncing" ? "60%" : status === "success" ? "100%" : "80%",
                }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
