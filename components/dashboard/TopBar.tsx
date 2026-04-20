// components/dashboard/TopBar.tsx
"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Menu } from "lucide-react"

interface TopBarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function TopBar({ sidebarOpen, onToggleSidebar }: TopBarProps) {
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="flex h-16 items-center px-4 gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        {!sidebarOpen && (
          <span className="hidden lg:block text-xl font-bold text-white tracking-tight">
            Urdu AI Video Creator
          </span>
        )}

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            {mounted && (
              <span className="hidden md:inline-block font-medium text-white">
                {user?.fullName || user?.firstName || "User"}
              </span>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "bg-black/95 border-white/20 backdrop-blur-xl",
                  userButtonPopoverActionButton: "text-white hover:bg-white/10",
                  userButtonPopoverActionButtonText: "text-white",
                  userButtonPopoverActionButtonIcon: "text-white/60",
                  userButtonPopoverFooter: "hidden",
                },
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </div>
    </header>
  )
}