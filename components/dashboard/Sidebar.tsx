"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Mic, 
  FileText, 
  Video, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react"
const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Mic, label: "Setup", href: "/dashboard/setup" },
  { icon: FileText, label: "Create Content", href: "/dashboard/create-content" },
  { icon: Video, label: "My Videos", href: "/dashboard/my-videos" },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()

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
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center ${isOpen ? 'px-4' : 'px-3 lg:justify-center'} py-3 text-base rounded-lg font-medium transition-all
                ${isActive
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25" 
                  : "text-white/80 hover:text-white hover:bg-white/10"}`}
            >
              <Icon className={`${isOpen ? 'mr-3 h-5 w-5' : 'h-6 w-6 lg:mr-0'}`} />
              <span className={`${!isOpen && "lg:hidden"}`}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}