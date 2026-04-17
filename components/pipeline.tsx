"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { geist } from "@/lib/fonts"

const VisualPipeline = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const [activeStep, setActiveStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Hydration mismatch fix: `useInView` is viewport-dependent and can differ
  // between SSR and the browser. Render nothing until the client mounts.
  useEffect(() => {
    setMounted(true)
  }, [])

  const steps = [
    {
      id: 1,
      title: "Text Input",
      description: "Enter your Urdu text",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      bgClass: "from-blue-500/20 to-blue-600/30",
      borderClass: "border-blue-500/30",
      glowClass: "shadow-[0_0_20px_rgba(59,130,246,0.3)]"
    },
    {
      id: 2,
      title: "Voice Processing",
      description: "AI clones your voice",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5,6 9,2 9,2 15,6 15,11 19,11 5"/>
          <path d="m19.07 4.93-1.41 1.41A9.06 9.06 0 0 1 20 12a9.06 9.06 0 0 1-2.34 5.66l1.41 1.41A11.05 11.05 0 0 0 22 12c0-3.11-1.26-5.92-3.93-7.93z"/>
          <path d="m15.54 8.46-1.41 1.41A2.97 2.97 0 0 1 15 12a2.97 2.97 0 0 1-.87 2.13l1.41 1.41A4.98 4.98 0 0 0 17 12a4.98 4.98 0 0 0-1.46-3.54z"/>
        </svg>
      ),
      bgClass: "from-green-500/20 to-green-600/30",
      borderClass: "border-green-500/30",
      glowClass: "shadow-[0_0_20px_rgba(34,197,94,0.3)]"
    },
    {
      id: 3,
      title: "Avatar Sync",
      description: "Lip-sync with avatar",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      bgClass: "from-purple-500/20 to-purple-600/30",
      borderClass: "border-purple-500/30", 
      glowClass: "shadow-[0_0_20px_rgba(147,51,234,0.3)]"
    },
    {
      id: 4,
      title: "Video Output",
      description: "Professional video ready",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7,16 12,23 17,23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      ),
      bgClass: "from-primary/20 to-primary/40",
      borderClass: "border-primary/30",
      glowClass: "shadow-[0_0_20px_rgba(231,138,83,0.3)]"
    }
  ]

  if (!mounted) return null

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      className="container mx-auto mb-12 max-w-6xl px-4"
    >
      {/* Main Title */}
      <motion.div 
        variants={itemVariants}
        className="text-center mb-12"
      >
        <h2
          className={cn(
            "mb-8 text-center text-4xl font-semibold tracking-tight text-white md:text-[54px] md:leading-[60px]",
            geist.className,
          )}
        >
          How It Works
        </h2>
        <p className="text-lg text-white/80 text-balance max-w-2xl mx-auto">
          Text → Professional Video in Minutes
        </p>
      </motion.div>

      {/* Pipeline Steps */}
      <div className="relative">
        {/* Background Connection Lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-blue-500/30 via-green-500/30 via-purple-500/30 to-primary/30 transform -translate-y-1/2 hidden md:block"></div>
        
        {/* Animated Progress Line */}
        <motion.div
          className="absolute top-1/2 left-0 h-px bg-gradient-to-r from-blue-500 via-green-500 via-purple-500 to-primary transform -translate-y-1/2 hidden md:block opacity-60"
          initial={{ width: "0%" }}
          animate={isInView ? { width: "100%" } : { width: "0%" }}
          transition={{ duration: 2, delay: 0.8, ease: "easeInOut" }}
        ></motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              variants={itemVariants}
              className="flex flex-col items-center text-center group cursor-pointer"
              onMouseEnter={() => setActiveStep(index)}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Step Icon */}
              <motion.div
                className={cn(
                  "relative mb-6 p-6 rounded-xl border-2 text-foreground shadow-xl transition-all duration-300 ease-in-out",
                  "bg-gradient-to-br",
                  step.bgClass,
                  step.borderClass,
                  activeStep === index && step.glowClass
                )}
                whileHover={{ 
                  rotate: [0, -3, 3, 0],
                  transition: { duration: 0.4, ease: "easeInOut" }
                }}
                animate={{
                  y: activeStep === index ? -8 : 0,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Pulsing Ring Effect */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-xl border-2 opacity-40",
                    step.borderClass
                  )}
                  animate={{
                    scale: activeStep === index ? [1, 1.1, 1] : 1,
                    opacity: activeStep === index ? [0.4, 0.8, 0.4] : 0.4
                  }}
                  transition={{
                    duration: 2,
                    repeat: activeStep === index ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Icon */}
                <div className="relative z-10">
                  {step.icon}
                </div>

                {/* Step Number Badge */}
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ 
                    delay: 0.6 + (index * 0.1), 
                    type: "spring", 
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  {step.id}
                </motion.div>
              </motion.div>

              {/* Step Content */}
              <motion.div
                className="space-y-2"
                animate={{
                  y: activeStep === index ? -4 : 0
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <h4 className={cn(
                  "text-lg font-semibold tracking-tight text-white",
                  geist.className
                )}>
                  {step.title}
                </h4>
                <p className="text-sm text-white/80 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>

              {/* Arrow for Mobile */}
              {index < steps.length - 1 && (
                <motion.div
                  className="mt-6 mb-6 md:hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 0.6, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ delay: 1.2 + (index * 0.1), duration: 0.4 }}
                >
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Description */}
      <motion.div
        variants={itemVariants}
        className="text-center mt-12 p-6 rounded-xl bg-card border border-border shadow-lg transition-all duration-300 hover:shadow-xl"
      >
        <motion.div
          className="flex items-center justify-center gap-3 mb-4"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span className="text-xl">⚡</span>
          <span className={cn(
            "text-lg font-semibold text-white tracking-tight",
            geist.className
          )}>
            One-time Setup
          </span>
        </motion.div>
        <p className="text-sm text-white/80 leading-relaxed max-w-2xl mx-auto text-balance">
          After initial voice cloning and avatar creation, simply input Urdu text and get professional, 
          lip-synced videos in minutes. Perfect for content creators, educators, and businesses.
        </p>
      </motion.div>
    </motion.div>
  )
}

export default VisualPipeline