import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from "@clerk/nextjs"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Urdu AI Video Creator",
  description: "Created by Amin",
  icons: {
    icon: "/weblogo-removebg-preview.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
