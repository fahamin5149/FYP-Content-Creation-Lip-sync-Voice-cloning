// app/dashboard/page.tsx
"use client"

import { useUser } from "@clerk/nextjs"
import Link from "next/link"
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

  return (
    <DashboardLayout>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/5 to-transparent p-8 shadow-xl backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-white/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Welcome back</p>
            <h1 className="text-3xl font-bold text-white">Your creator cockpit</h1>
            <p className="mt-2 text-white/70 max-w-2xl">
              Kick off a new script, polish an existing draft, or jump into your media library. The full pipeline lives here.
            </p>
          </div>
          <Link href="/dashboard/create-content" className="inline-flex">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-lg shadow-primary/30 hover:scale-[1.01] transition-transform">
              Create Content
            </button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}