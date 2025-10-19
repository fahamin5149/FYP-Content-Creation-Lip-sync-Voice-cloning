"use client"

import type React from "react"
import { useState } from "react"
import { CheckCircle, XCircle, Eye, EyeOff, AlertCircle, UserPlus, User, Mail, Lock, Building, X } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useGoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

// Validation functions
const validateFullName = (name: string): string | null => {
  const trimmedName = name.trim()

  if (!trimmedName || trimmedName.length === 0) {
    return "Full name is required."
  }

  if (trimmedName.length < 3) {
    return "Full name must be at least 3 characters long."
  }

  if (trimmedName.length > 50) {
    return "Full name must not exceed 50 characters."
  }

  const validNameRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/
  if (!validNameRegex.test(trimmedName)) {
    return "Full name must contain only English letters and single spaces between words."
  }

  if (/\d/.test(trimmedName)) {
    return "Full name cannot contain numbers."
  }

  if (/[!@#$%^&*(),.?":{}|<>[\]\\/_+=`~;'-]/.test(trimmedName)) {
    return "Full name cannot contain special characters."
  }

  if (/[^\x00-\x7F]/.test(trimmedName)) {
    return "Full name must contain only English letters."
  }

  const htmlTagRegex = /<[^>]*>/g
  if (htmlTagRegex.test(trimmedName)) {
    return "Invalid input detected."
  }

  if (/\s{2,}/.test(trimmedName)) {
    return "Full name cannot contain multiple consecutive spaces."
  }

  return null
}

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

  if (!/[!@#$%^&*(),.?":{}|<>\[\]_\/~'`=+\-\\;]/.test(pass)) {
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

const calculatePasswordStrength = (
  pass: string
): { strength: number; label: string; color: string; gradient: string } => {
  if (pass.length === 0) {
    return { strength: 0, label: "Enter password", color: "bg-slate-300", gradient: "from-slate-300 to-slate-400" }
  }

  let strength = 0

  if (pass.length > 10) strength += 20
  if (pass.length > 15) strength += 10
  if (pass.length > 20) strength += 10

  const specialRegex = /[!@#$%^&*(),.?":{}|<>\[\]_\/~'`=+\-\\;]/g

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

const SuccessModal = ({
  isOpen,
  onClose,
  type,
  onRedirect,
  userEmail,
}: {
  isOpen: boolean
  onClose: () => void
  type: "email" | "google"
  onRedirect: () => void
  userEmail?: string
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center"
      >
      <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {type === "email" ? (
          <>
            <h3 className="text-xl font-semibold text-white mb-2">Check Your Email</h3>
            <p className="text-zinc-400 mb-6">
              A verification email has been sent to <span className="text-white font-medium">{userEmail}</span>. Check
              your inbox and spam folder. Please click the link in the email to verify your account before login.
            </p>
            <Button onClick={onRedirect} className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white">
              Go to Sign In
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-white mb-2">You have successfully created account</h3>
            <p className="text-zinc-400 mb-6">Welcome to Urdu AI Platform!</p>
            <Button onClick={onRedirect} className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white">
              Go to Dashboard
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const { signup, googleSignUp, googleSignIn } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; type: "email" | "google" }>({
    isOpen: false,
    type: "email",
  })
  
  // Error states for each field
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState("")
  const [passwordTouched, setPasswordTouched] = useState(false)

  const passwordStrength = calculatePasswordStrength(formData.password)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const allowedCharsRegex = /^[A-Za-z\s]*$/
    
    if (!allowedCharsRegex.test(value)) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      name: value,
    }))
    
    if (nameError) {
      setNameError(null)
    }
    if (generalError) {
      setGeneralError("")
    }
  }

  const handleNameBlur = () => {
    const error = validateFullName(formData.name)
    setNameError(error)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      email: value,
    }))
    
    if (emailError === "This email is already registered. Please sign in instead.") {
      setEmailError(null)
    }
    if (generalError) {
      setGeneralError("")
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    if (/[^\x00-\x7F]/.test(value)) {
      return
    }

    if (value.length > 128) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      password: value,
    }))
    
    setPasswordTouched(true)
    const error = validatePassword(value)
    setPasswordError(error)
    
    if (generalError) {
      setGeneralError("")
    }
  }

  const handlePasswordBlur = () => {
    const error = validatePassword(formData.password)
    setPasswordError(error)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      confirmPassword: e.target.value,
    }))
    if (generalError) {
      setGeneralError("")
    }
  }

  const isPasswordValidGlobally = (): boolean => {
    if (formData.password.length === 0) return false
    return validatePassword(formData.password) === null
  }

  const isFormValid =
    formData.name.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.password.trim().length > 0 &&
    formData.confirmPassword.trim().length > 0 &&
    !validateFullName(formData.name) &&
    !validatePassword(formData.password) &&
    !emailError &&
    !nameError &&
    !passwordError &&
    formData.password === formData.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError("")

    const trimmedName = formData.name.trim()
    const nameValidationError = validateFullName(trimmedName)
    if (nameValidationError) {
      setNameError(nameValidationError)
      setGeneralError(nameValidationError)
      return
    }

    const passwordValidationError = validatePassword(formData.password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      setGeneralError(passwordValidationError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setGeneralError("Passwords do not match")
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await signup(trimmedName, formData.email, formData.password)
      setSuccessModal({ isOpen: true, type: "email" })
    } catch (error: any) {
      const errorMsg = error?.message || "An error occurred while creating account."
      setGeneralError(errorMsg)
      
      if (errorMsg.toLowerCase().includes("already registered") || errorMsg.toLowerCase().includes("already in use")) {
        setEmailError("This email is already registered. Please sign in instead.")
      }
      
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
      setGoogleLoading(true)
      setGeneralError("")
      try {
        // tokenResponse may contain credential or access_token depending on flow
        const token = (tokenResponse as any).credential || (tokenResponse as any).access_token || (tokenResponse as any).code
        if (!token) throw new Error("Failed to obtain Google token")
        await googleSignIn(token)
        setSuccessModal({ isOpen: true, type: "google" })
      } catch (error: any) {
        const errorMsg = error?.message || "Google signup failed"
        setGeneralError(errorMsg)
        toast({ title: "Error", description: errorMsg, variant: "destructive" })
      } finally {
        setIsLoading(false)
        setGoogleLoading(false)
      }
    },
    onError: (err) => {
      const msg = (err as any)?.error || "Google authentication failed"
      setGeneralError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    },
  })

  const handleModalRedirect = () => {
    setSuccessModal({ isOpen: false, type: "email" })
    router.push(successModal.type === "email" ? "/login" : "/dashboard")
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, type: "email" })}
        type={successModal.type}
        onRedirect={handleModalRedirect}
        userEmail={formData.email}
      />

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
      <div className="absolute top-20 right-20 w-72 h-72 bg-[#e78a53]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#e78a53]/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-zinc-400">Join thousands of creators building with Urdu AI Platform</p>
          {generalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
              <p className="text-red-400 text-sm">{generalError}</p>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  className={`pl-10 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:ring-[#e78a53]/20 ${
                    nameError ? "border-red-500 focus:border-red-500" : "border-zinc-700"
                  }`}
                  required
                  disabled={isLoading || googleLoading}
                  maxLength={50}
                />
              </div>
              {nameError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {nameError}
                </p>
              )}
              <p className="text-xs text-zinc-500">
                3-50 characters, English letters only, single spaces between words
              </p>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleEmailChange}
                  className={`pl-10 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:ring-[#e78a53]/20 ${
                    emailError ? "border-red-500 focus:border-red-500" : "border-zinc-700"
                  }`}
                  required
                  disabled={isLoading || googleLoading}
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  className={`pl-10 pr-10 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:ring-[#e78a53]/20 ${
                    passwordError ? "border-red-500 focus:border-red-500" : "border-zinc-700"
                  }`}
                  required
                  autoComplete="new-password"
                  disabled={isLoading || googleLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {passwordError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {passwordError}
                </p>
              )}

              {/* Password Strength Meter */}
              {formData.password.length > 0 && (
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">Password Strength</span>
                    <span
                      className={`font-bold ${
                        passwordStrength.label === "Very Strong"
                          ? "text-green-400"
                          : passwordStrength.label === "Strong"
                            ? "text-green-400"
                            : passwordStrength.label === "Good"
                              ? "text-yellow-400"
                              : passwordStrength.label === "Fair"
                                ? "text-orange-400"
                                : passwordStrength.label === "Invalid"
                                  ? "text-red-500"
                                  : "text-red-400"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="relative w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${passwordStrength.gradient}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    >
                      <div className="h-full w-full bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  {!isPasswordValidGlobally() && formData.password.length > 0 && (
                    <p className="text-xs text-zinc-400 mt-2 bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700">
                      <span className="font-medium">Tip:</span> Use uppercase, lowercase, numbers, and special
                      characters (11-128 chars)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={`pl-10 pr-10 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:ring-[#e78a53]/20 border-zinc-700`}
                  required
                  disabled={isLoading || googleLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isLoading || googleLoading}
              className={`w-full text-white font-medium py-3 rounded-xl transition-colors ${
                !isFormValid || isLoading || googleLoading
                  ? "bg-zinc-600 cursor-not-allowed opacity-60"
                  : "bg-[#e78a53] hover:bg-[#e78a53]/90"
              }`}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="text-[#e78a53] hover:text-[#e78a53]/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>

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
              disabled={isLoading || googleLoading}
            >
              {googleLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing up with Google...</span>
                </div>
              ) : (
                <>
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
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign up with Google
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}