// app/dashboard/page.tsx
"use client"

import { useUser } from "@clerk/nextjs"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser()

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-white/80">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Clerk middleware will handle redirects, but show nothing if not signed in
  if (!isSignedIn) {
    return null
  }

  return <DashboardLayout />
}