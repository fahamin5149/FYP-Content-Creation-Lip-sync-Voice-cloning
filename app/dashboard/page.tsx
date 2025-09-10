"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const { user, logout, loading } = useAuth()  
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
          >
            Sign Out
          </Button>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          <p className="text-zinc-400 mb-4">Email: {user.email}</p>
          <p className="text-zinc-400">Email Verified: {user.emailVerified ? "Yes" : "No"}</p>

          {!user.emailVerified && (
            <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-orange-400 text-sm">Please verify your email address to access all features.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
