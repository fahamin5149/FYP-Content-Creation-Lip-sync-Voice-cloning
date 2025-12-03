"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Home, 
  Mic, 
  FileText, 
  Video, 
  Settings, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard", enabled: true },
  { icon: Mic, label: "Voice Setup", href: "#", enabled: false },
  { icon: FileText, label: "Create Content", href: "#", enabled: false },
  { icon: Video, label: "My Videos", href: "#", enabled: false },
  { icon: Settings, label: "Settings", href: "#", enabled: false },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out bg-black/40 backdrop-blur-xl border-r border-white/10
      lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full lg:w-20"}`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        <span className={`text-xl font-bold text-white tracking-tight ${!isOpen && "lg:hidden"}`}>
          Urdu AI
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden lg:block p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="mt-6 px-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return item.enabled ? (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center px-4 py-3 text-base rounded-lg font-medium transition-all
                ${item.label === "Dashboard" 
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25" 
                  : "text-white/80 hover:text-white hover:bg-white/10"}`}
            >
              <Icon className="mr-3 h-5 w-5" />
              <span className={`${!isOpen && "lg:hidden"}`}>{item.label}</span>
            </Link>
          ) : (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center px-4 py-3 text-base rounded-lg cursor-not-allowed opacity-40 text-white/60"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span className={`${!isOpen && "lg:hidden"}`}>{item.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/20">
                <p className="text-white">Coming Soon</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </div>
  )
}