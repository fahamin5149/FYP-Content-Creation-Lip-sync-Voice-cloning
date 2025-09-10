"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailVerificationError, setEmailVerificationError] = useState("")
  const { user, setUser, logout } = useAuth()
  const { signIn, signInWithGoogle, resetPassword } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setEmailVerificationError("") // clear any old error

  try {
    const user = await signIn(email, password)
    // ✅ If no error, go to dashboard
    router.push("/dashboard")
  } catch (err: any) {
    if (err.message === "EmailUnverified") {
      await logout()
      setUser(null)
      setEmailVerificationError(
        "Please verify your email first before signing in. Check your inbox for the verification link."
      )
    } else if (err.message === "Firebase: Error (auth/invalid-credential).") {
      setEmailVerificationError("Invalid credentials. Please try again.")
    } else {
      setEmailVerificationError(err.message)
    }
  } finally {
    setIsLoading(false)
  }
}

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setEmailVerificationError("")
    try {
      const user = await signInWithGoogle()

      if (user && !user.emailVerified) {
        console.log("Google user email not verified:", user.email)
        setEmailVerificationError(
          "Please verify your email first before signing in. Check your inbox for the verification link.",
        )
        return
      }

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailVerificationError) {
      setEmailVerificationError("")
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (emailVerificationError) {
      setEmailVerificationError("")
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(email)
      toast({
        title: "Email Sent!",
        description: "Please check your email for the password reset link.",
      })
      setShowForgotPassword(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 text-zinc-400 hover:text-[#e78a53] transition-colors duration-200 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Home</span>
      </Link>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#e78a53]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#e78a53]/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {showForgotPassword ? "Reset Password" : "Welcome back"}
          </h1>
          <p className="text-zinc-400">
            {showForgotPassword
              ? "Enter your email to receive a password reset link"
              : "Sign in to your account to continue"}
          </p>

          {emailVerificationError && !showForgotPassword && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <p className="text-red-400 text-sm">{emailVerificationError}</p>
            </motion.div>
          )}
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
        >
          {!showForgotPassword ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:ring-[#e78a53]/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:ring-[#e78a53]/20"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-700 bg-zinc-800 text-[#e78a53] focus:ring-[#e78a53]/20"
                    />
                    <span className="text-zinc-300">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-[#e78a53] hover:text-[#e78a53]/80"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-zinc-400">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-[#e78a53] hover:text-[#e78a53]/80 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:ring-[#e78a53]/20"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium py-3 rounded-xl transition-colors"
              >
                {isLoading ? "Sending..." : "Send Reset Email"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-zinc-300 hover:text-white"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          )}
        </motion.div>

        {/* Social Login */}
        {!showForgotPassword && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-zinc-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-all duration-200 group"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg
                  className="w-5 h-5 mr-2 text-zinc-300 group-hover:text-black transition-colors duration-200"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77C17.45 20.53 14.97 23 12 23 7.7 23 3.99 20.53 2.18 17.07l3.66 2.84C5.84 20.53 9.55 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C5.84 7.92 9.55 1 12 1z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
