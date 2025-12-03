import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { Suspense } from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"
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
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
            <AuthProvider>{children}</AuthProvider>
          </GoogleOAuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
