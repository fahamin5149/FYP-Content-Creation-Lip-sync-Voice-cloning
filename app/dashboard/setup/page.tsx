"use client"

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { SetupPage } from "@/components/setup/SetupPage"

export default function SetupRoute() {
  return (
    <DashboardLayout>
      <SetupPage />
    </DashboardLayout>
  )
}
