"use client"

import { SignUp } from "@clerk/nextjs"
import { motion } from "framer-motion"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">
      {/* Left Panel - Visual/Branding Side */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative lg:w-1/2 w-full min-h-[40vh] lg:min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex flex-col justify-between p-6 lg:p-8 overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#e78a53]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-[#e78a53]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-[#e78a53]/5 to-transparent rounded-full blur-2xl" />

        {/* Top Section - Logo and Back Link */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-zinc-400 hover:text-[#e78a53] transition-colors duration-200 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Urdu AI<span className="text-[#e78a53]"> Video Creator</span>
            </h1>
            <p className="text-base text-zinc-400 max-w-md">
              Join thousands of creators using AI-powered voice cloning and lip-sync technology.
            </p>
          </motion.div>
        </div>

        {/* Center Visual Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative z-10 hidden lg:flex items-center justify-center py-4"
        >
          <div className="relative">
            <div className="w-48 h-48 border-2 border-[#e78a53]/30 rounded-3xl -rotate-12 absolute top-0 left-0" />
            <div className="w-48 h-48 bg-gradient-to-br from-[#e78a53]/20 to-transparent rounded-3xl rotate-6" />
          </div>
        </motion.div>

        {/* Bottom Section - Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10"
        >
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 max-w-md">
            <h3 className="text-white text-sm font-semibold mb-3">What you'll get:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-[#e78a53]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#e78a53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-zinc-300 text-xs">Unlimited AI voice cloning</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-[#e78a53]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#e78a53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-zinc-300 text-xs">Professional lip-sync technology</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-[#e78a53]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#e78a53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-zinc-300 text-xs">Export in HD quality</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Panel - Sign Up Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        className="lg:w-1/2 w-full min-h-screen bg-black flex items-center justify-center p-4 lg:p-8"
      >
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-full"
          >
            <SignUp
              appearance={{
                baseTheme: undefined,
                variables: {
                  colorPrimary: "#e78a53",
                  colorBackground: "#18181b",
                  colorInputBackground: "#27272a",
                  colorInputText: "#ffffff",
                  colorText: "#ffffff",
                  colorTextSecondary: "#a1a1aa",
                  colorDanger: "#ef4444",
                  colorSuccess: "#22c55e",
                  borderRadius: "0.75rem",
                },
                elements: {
                  rootBox: "w-full",
                  card: "bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-none",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "bg-zinc-900/50 border-zinc-800 text-white hover:bg-white hover:text-black hover:border-white transition-all duration-200 [&_svg]:fill-white [&_svg]:hover:fill-black",
                  socialButtonsBlockButtonText: "text-white font-medium !text-white",
                  socialButtonsIconButton: "border-zinc-800 hover:border-white",
                  formButtonPrimary:
                    "bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium rounded-xl normal-case shadow-none",
                  formFieldInput:
                    "bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:ring-[#e78a53]/20 rounded-xl",
                  formFieldLabel: "text-white font-medium",
                  formFieldAction: "text-[#e78a53] hover:text-[#e78a53]/80",
                  footerActionLink: "text-[#e78a53] hover:text-[#e78a53]/80 font-medium",
                  footerActionText: "text-zinc-400",
                  footerAction: "text-zinc-400",
                  dividerLine: "bg-zinc-800",
                  dividerText: "text-zinc-500 bg-transparent",
                  identityPreviewText: "text-zinc-300",
                  identityPreviewEditButton: "text-[#e78a53] hover:text-[#e78a53]/80",
                  formFieldInputShowPasswordButton: "text-zinc-400 hover:text-zinc-300",
                  formFieldSuccessText: "text-green-400",
                  formFieldErrorText: "text-red-400",
                  formFieldWarningText: "text-yellow-400",
                  formFieldHintText: "text-zinc-400",
                  otpCodeFieldInput:
                    "bg-zinc-800/50 border-zinc-700 text-white focus:border-[#e78a53] focus:ring-[#e78a53]/20",
                  formResendCodeLink: "text-[#e78a53] hover:text-[#e78a53]/80",
                  footer: "hidden",
                  alternativeMethodsBlockButton:
                    "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600",
                  alternativeMethodsBlockButtonText: "text-zinc-300",
                  identityPreview: "bg-transparent border-0",
                  identityPreviewBox: "bg-transparent",
                  formHeaderTitle: "text-white",
                  formHeaderSubtitle: "text-zinc-400",
                  main: "bg-transparent",
                },
                layout: {
                  socialButtonsPlacement: "bottom",
                  socialButtonsVariant: "blockButton",
                  showOptionalFields: true,
                },
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
