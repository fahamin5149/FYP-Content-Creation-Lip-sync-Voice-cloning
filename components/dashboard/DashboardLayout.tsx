//components/dashboard/DashboardLayout.tsx
"use client"

import { ReactNode, useState } from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { DashboardContent } from "./DashboardContent"

interface DashboardLayoutProps {
  children?: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-black relative">
      {/* Pearl Mist Background with Top Glow - matching landing page */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />
      <div className="relative z-10">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`${sidebarOpen ? "lg:pl-64" : "lg:pl-20"} transition-all duration-300 ease-in-out`}>
          <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="py-8 px-4 sm:px-6 lg:px-8">
            {children ?? <DashboardContent />}
          </main>
        </div>
      </div>
    </div>
  )
}