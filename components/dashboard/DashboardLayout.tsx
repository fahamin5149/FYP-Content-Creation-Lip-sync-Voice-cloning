//components/dashboard/DashboardLayout.tsx
"use client"

import { ReactNode, useState } from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { DashboardContent } from "./DashboardContent"
import { GenerationStatusTray } from "./GenerationStatusTray"

interface DashboardLayoutProps {
  children?: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div
        className={`${sidebarOpen ? "lg:pl-64" : "lg:pl-[5.25rem]"} transition-[padding] duration-300`}
      >
        <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <GenerationStatusTray />
          {children ?? <DashboardContent />}
        </main>
      </div>
    </div>
  )
}
