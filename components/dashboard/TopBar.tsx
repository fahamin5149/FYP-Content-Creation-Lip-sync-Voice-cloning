// components/dashboard/TopBar.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserProfile, logout as logoutApi } from "@/lib/api"
import {
  Bell,
  ChevronDown,
  Globe,
  Menu,
  User,
  LogOut
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"

interface TopBarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

interface UserProfile {
  id: number
  email: string
  fullName: string
  isEmailVerified: boolean
  createdAt: string
}

export function TopBar({ sidebarOpen, onToggleSidebar }: TopBarProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile()
      setUser(profile)
    } catch (error) {
      console.error("Failed to load user profile:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutApi()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Even if logout API fails, redirect to home
      router.push("/")
    }
  }
  
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

        <div className="ml-auto flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-40 cursor-not-allowed text-white">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Language</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-black/90 border-white/20">
              <p className="text-white">Coming Soon</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-40 cursor-not-allowed text-white">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-black/90 border-white/20">
              <p className="text-white">Coming Soon</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white">
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="hidden md:inline-block font-medium">
                  {user?.fullName || user?.email || "User"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/95 border-white/20 backdrop-blur-xl">
              <DropdownMenuLabel className="text-white/80">{user?.email || "Loading..."}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="opacity-40 cursor-not-allowed text-white/60">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-white hover:bg-white/10 focus:bg-white/10">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}