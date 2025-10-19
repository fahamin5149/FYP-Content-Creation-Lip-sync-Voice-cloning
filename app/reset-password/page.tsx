"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { validateResetToken, resetPassword } from "@/lib/api"

// Local copy of validatePassword (kept in sync with signup page)
const validatePassword = (pass: string): string | null => {
  if (pass !== pass.trim()) {
    return "Password cannot have leading or trailing spaces."
  }

  if (/\s/.test(pass)) {
    return "Spaces are not allowed in the password."
  }

  if (pass.length <= 10) {
    return "Password must be longer than 10 characters."
  }

  if (pass.length > 128) {
    return "Password must not exceed 128 characters."
  }

  if (/[^\x00-\x7F]/.test(pass)) {
    return "Password cannot contain emojis or special Unicode characters."
  }

  if (!/[!@#$%^&*(),.?\":{}|<>\[\]_\/_~'`=+\-\\;]/.test(pass)) {
    return "Password must include at least one special character"
  }

  if (!/\d/.test(pass)) {
    return "Password must include at least one number."
  }

  if (!/[A-Z]/.test(pass)) {
    return "Password must include at least one capital letter."
  }

  if (!/[a-z]/.test(pass)) {
    return "Password must include at least one lowercase letter."
  }

  return null
}

const calculatePasswordStrength = (pass: string): { strength: number; label: string; color: string; gradient: string } => {
  if (pass.length === 0) {
    return { strength: 0, label: "Enter password", color: "bg-slate-300", gradient: "from-slate-300 to-slate-400" }
  }

  let strength = 0

  if (pass.length > 10) strength += 20
  if (pass.length > 15) strength += 10
  if (pass.length > 20) strength += 10

  const specialRegex = /[!@#$%^&*(),.?\":{}|<>\[\]_\/_~'`=+\-\\;]/g

  if (specialRegex.test(pass)) strength += 20
  if (/\d/.test(pass)) strength += 15
  if (/[A-Z]/.test(pass)) strength += 15
  if (/[a-z]/.test(pass)) strength += 10

  const specialCount = (pass.match(specialRegex) || []).length
  const numberCount = (pass.match(/\d/g) || []).length
  const upperCount = (pass.match(/[A-Z]/g) || []).length

  if (specialCount > 1) strength += 5
  if (numberCount > 1) strength += 5
  if (upperCount > 1) strength += 5

  const hasInvalidSpaces = pass !== pass.trim() || /\s/.test(pass)
  const hasEmojis = /[^\x00-\x7F]/.test(pass)
  const tooLong = pass.length > 128

  let label = "Very Weak"
  let color = "bg-red-500"
  let gradient = "from-red-500 to-red-600"

  if (hasInvalidSpaces || hasEmojis || tooLong) {
    label = "Invalid"
    color = "bg-red-600"
    gradient = "from-red-600 to-red-700"
  } else if (strength >= 85) {
    label = "Very Strong"
    color = "bg-green-500"
    gradient = "from-green-500 to-green-600"
  } else if (strength >= 70) {
    label = "Strong"
    color = "bg-green-400"
    gradient = "from-green-400 to-green-500"
  } else if (strength >= 50) {
    label = "Good"
    color = "bg-yellow-500"
    gradient = "from-yellow-500 to-yellow-600"
  } else if (strength >= 30) {
    label = "Fair"
    color = "bg-orange-500"
    gradient = "from-orange-500 to-orange-600"
  } else {
    label = "Weak"
    color = "bg-red-500"
    gradient = "from-red-500 to-red-600"
  }

  return { strength: Math.min(strength, 100), label, color, gradient }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading")
  const [message, setMessage] = useState("")
  const [token, setToken] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const t = searchParams.get("token")
    if (!t) {
      setStatus("invalid")
      setMessage("No reset token provided.")
      return
    }
    setToken(t)
    const validate = async () => {
      try {
        const res = await validateResetToken(t)
        if (res && res.email) {
          setStatus("valid")
        } else {
          setStatus("invalid")
          setMessage("Invalid or expired reset link.")
        }
      } catch (err: any) {
        setStatus("invalid")
        setMessage(err?.message || "Invalid or expired reset link.")
      }
    }
    validate()
  }, [searchParams])

  const passwordStrength = calculatePasswordStrength(password)

  const passwordChecks = [
    { label: "At least 11 characters", test: (pw: string) => pw.length > 10 },
    { label: "At least one uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "At least one lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
    { label: "At least one number", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "At least one special character", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

  const passErr = validatePassword(password)
    if (passErr) {
      setMessage(passErr)
      return
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await resetPassword(token, password, confirmPassword)
      setStatus("valid")
      setMessage(res?.message || "Password reset successful. Redirecting to login...")
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err: any) {
      setMessage(err?.message || "Failed to reset password.")
    } finally {
      setIsSubmitting(false)
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 text-center"
        >
          {status === "loading" && (
            <>
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Validating reset link</h1>
              <p className="text-zinc-400">Please wait while we verify your password reset link...</p>
            </>
          )}

          {status === "invalid" && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Reset Link Invalid</h1>
              <p className="text-red-400 mb-6">{message || "Reset link is invalid or has expired."}</p>
              <div className="space-y-3">
                <Button onClick={() => router.push("/forgot-password") } className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium py-3 rounded-xl transition-colors">Request new reset email</Button>
                <Button onClick={() => router.push("/signup") } variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-medium py-3 rounded-xl transition-colors">Back to Sign Up</Button>
              </div>
            </>
          )}

          {status === "valid" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
              <p className="text-zinc-400 mb-4">Enter your new password below.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">New Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10 bg-zinc-800/50 text-white placeholder:text-zinc-500" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10 bg-zinc-800/50 text-white placeholder:text-zinc-500" required />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300">{showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  </div>
                </div>

                <div className="text-left">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400 font-medium">Password Strength</span>
                    <span className={`font-bold ${passwordStrength.label === "Very Strong" ? "text-green-400" : passwordStrength.label === "Strong" ? "text-green-400" : passwordStrength.label === "Good" ? "text-yellow-400" : passwordStrength.label === "Fair" ? "text-orange-400" : passwordStrength.label === "Invalid" ? "text-red-500" : "text-red-400"}`}>{passwordStrength.label}</span>
                  </div>

                  <div className="relative w-full bg-zinc-700 rounded-full h-3 overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${passwordStrength.gradient}`} style={{ width: `${passwordStrength.strength}%` }} />
                  </div>

                  <div className="space-y-1">
                    {passwordChecks.map((check) => {
                      const passed = check.test(password)
                      return (
                        <div key={check.label} className="flex items-center text-sm gap-2">
                          <span className={passed ? "text-green-500" : "text-red-400"}>{passed ? "✔" : "✖"}</span>
                          <span className={passed ? "text-green-500" : "text-red-400"}>{check.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {message && <p className="text-sm text-red-400">{message}</p>}

                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium py-3 rounded-xl transition-colors">{isSubmitting ? "Resetting..." : "Reset Password"}</Button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
