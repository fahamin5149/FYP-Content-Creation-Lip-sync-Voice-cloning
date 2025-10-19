"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useGoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { login, googleSignUp, googleSignIn } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailVerificationError, setEmailVerificationError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setEmailVerificationError("")

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      const errorMsg = err?.message || "An error occurred. Please try again."
      setEmailVerificationError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      setEmailVerificationError("")
      try {
        const token = (tokenResponse as any).credential || (tokenResponse as any).id_token || (tokenResponse as any).access_token || (tokenResponse as any).code
        if (!token) throw new Error("Failed to obtain Google token")
        await googleSignIn(token)
        router.push("/dashboard")
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Google sign in failed", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    },
    onError: (err) => {
      const msg = (err as any)?.error || "Google authentication failed"
      toast({ title: "Error", description: msg, variant: "destructive" })
    },
    scope: "openid email profile", // Add profile scope to get user name
  })

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
      toast({ title: "Error", description: "Please enter your email address", variant: "destructive" })
      return
    }

    setIsLoading(true)
    setForgotSent(false)
    try {
      const res = await (await import("@/lib/api")).forgotPassword(email)
      toast({ title: "Email Sent!", description: res?.message || "Please check your email for the password reset link." })
      setForgotSent(true)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reset email", variant: "destructive" })
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

      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#e78a53]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#e78a53]/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
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
            <div>
              {!forgotSent ? (
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
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-zinc-300">If an account with that email exists, we've sent a password reset link.</p>
                  <Button
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotSent(false)
                    }}
                    className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Back to Sign In
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>

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
                onClick={() => googleLogin()}
                disabled={isLoading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.72 1.22 9.23 3.6l6.85-6.85C36.44 2.63 30.77 0 24 0 14.64 0 6.4 5.34 2.56 13.11l7.98 6.19C12.14 13.23 17.62 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.59-.14-3.11-.41-4.59H24v9.18h12.68c-.55 2.96-2.19 5.47-4.68 7.16l7.54 5.85C43.9 38.35 46.5 31.9 46.5 24.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.54 28.3c-.5-1.46-.78-3.02-.78-4.8s.28-3.34.78-4.8l-7.98-6.19C1.64 15.64 0 19.64 0 24s1.64 8.36 4.56 11.49l7.98-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.92-2.13 15.89-5.79l-7.54-5.85c-2.07 1.39-4.73 2.19-8.35 2.19-6.38 0-11.86-3.73-14.46-9.11l-7.98 6.19C6.4 42.66 14.64 48 24 48z"
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