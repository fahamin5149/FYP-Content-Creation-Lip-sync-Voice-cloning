"use client"

import type React from "react"

import { useTheme } from "next-themes"
import Earth from "./ui/globe"
import Avatar3D from "./ui/avatarobj"

import ScrambleHover from "./ui/scramble"
import { motion, useInView } from "framer-motion"
import { Suspense, useEffect, useRef, useState } from "react"
import { geist } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { MdRecordVoiceOver, MdGraphicEq, MdTranslate } from "react-icons/md";
import { FaRobot, FaCheckCircle, FaBullseye } from "react-icons/fa";
import VisualPipeline from "./pipeline"




export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const { theme } = useTheme()
  const [isHovering, setIsHovering] = useState(false)
  const [isCliHovering, setIsCliHovering] = useState(false)
  const [isFeature3Hovering, setIsFeature3Hovering] = useState(false)
  const [isFeature4Hovering, setIsFeature4Hovering] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const [baseColor, setBaseColor] = useState<[number, number, number]>([0.906, 0.541, 0.325]) // #e78a53 in RGB normalized
  const [glowColor, setGlowColor] = useState<[number, number, number]>([0.906, 0.541, 0.325]) // #e78a53 in RGB normalized

  const [dark, setDark] = useState<number>(theme === "dark" ? 1 : 0)

  useEffect(() => {
    setBaseColor([0.906, 0.541, 0.325]) // #e78a53
    setGlowColor([0.906, 0.541, 0.325]) // #e78a53
    setDark(theme === "dark" ? 1 : 0)
  }, [theme])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setInputValue("")
    }
  }

  return (
  
    <section id="features" className="text-foreground relative overflow-hidden py-12 sm:py-24 md:py-32">
      <div className="bg-primary absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl select-none"></div>
      <div className="via-primary/50 absolute top-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent transition-all ease-in-out"></div>
      <motion.div
      
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 0 }}
        className="container mx-auto flex flex-col items-center gap-6 sm:gap-12"
      >
        <h2
          className={cn(
            "via-foreground mb-8 bg-gradient-to-b from-zinc-800 to-zinc-700 bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px]",
            geist.className,
          )}
        >
          Key Features
        </h2>
        <div>
          <div>
            <div className="grid grid-cols-12 gap-4 justify-center">
              {/* Voice Cloning Feature */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-2"
                onMouseEnter={() => setIsCliHovering(true)}
                onMouseLeave={() => setIsCliHovering(false)}
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(231, 138, 83, 0.6)",
                  boxShadow: "0 0 30px rgba(231, 138, 83, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">
                    Voice Cloning
                  </h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Advanced AI technology that learns and replicates your unique voice characteristics with minimal
                      training data.
                    </p>
                  </div>
                </div>
                <div className="pointer-events-none flex grow items-center justify-center select-none relative">
                  <div
                    className="relative w-full h-[400px] rounded-xl overflow-hidden"
                    style={{ borderRadius: "20px" }}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <img
                        src="https://framerusercontent.com/images/UjqUIiBHmIcSH9vos9HlG2BF4bo.png"
                        alt="Arrow-CoreExchange"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>

                    {/* Animated SVG Connecting Lines */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={isCliHovering ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <svg width="100%" height="100%" viewBox="0 0 121 94" className="absolute">
                        <motion.path
                          d="M 60.688 1.59 L 60.688 92.449 M 60.688 92.449 L 119.368 92.449 M 60.688 92.449 L 1.414 92.449"
                          stroke="rgb(255,222,213)"
                          fill="transparent"
                          strokeDasharray="2 2"
                          initial={{ pathLength: 0 }}
                          animate={isCliHovering ? { pathLength: 1 } : { pathLength: 0 }}
                          transition={{
                            duration: 2,
                            ease: "easeInOut",
                          }}
                        />
                      </svg>
                      <svg width="100%" height="100%" viewBox="0 0 121 94" className="absolute">
                        <motion.path
                          d="M 60.688 92.449 L 60.688 1.59 M 60.688 1.59 L 119.368 1.59 M 60.688 1.59 L 1.414 1.59"
                          stroke="rgb(255,222,213)"
                          fill="transparent"
                          strokeDasharray="2 2"
                          initial={{ pathLength: 0 }}
                          animate={isCliHovering ? { pathLength: 1 } : { pathLength: 0 }}
                          transition={{
                            duration: 2,
                            delay: 0.5,
                            ease: "easeInOut",
                          }}
                        />
                      </svg>
                    </motion.div>

                    {/* Animated Purple Blur Effect */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-16 h-16 bg-purple-500 rounded-full blur-[74px] opacity-65 transform -translate-x-1/2 -translate-y-1/2"
                      initial={{ scale: 1 }}
                      animate={isCliHovering ? { scale: [1, 1.342, 1, 1.342] } : { scale: 1 }}
                      transition={{
                        duration: 3,
                        ease: "easeInOut",
                        repeat: isCliHovering ? Number.POSITIVE_INFINITY : 0,
                        repeatType: "loop",
                      }}
                    />

                    {/* Main Content Container with Staggered Animations */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-8">
                        {/* Left Column */}
                        <div className="flex flex-col gap-3">
                          {["Voice Sample", "Tone Analysis", "Accent Match"].map((item, index) => (
                            <motion.div
                              key={`left-${index}`}
                              className="rounded px-3 py-2 flex items-center gap-2 text-sm font-medium shadow-lg"
                              style={{
                                backgroundColor: "#ffffff",
                                color: "#1f2937",
                                border: "1px solid #e5e7eb",
                              }}
                              initial={{ opacity: 1, x: 0 }}
                              animate={isCliHovering ? { x: [-20, 0] } : { x: 0 }}
                              transition={{
                                duration: 0.5,
                                delay: index * 0.1,
                              }}
                              whileHover={{ scale: 1.05 }}
                            >
                          <div className="w-4 h-4 flex items-center justify-center">
                            {index === 0 && <MdRecordVoiceOver className="text-gray-700" size={16} />}
                            {index === 1 && <MdGraphicEq className="text-gray-700" size={16} />}
                            {index === 2 && <MdTranslate className="text-gray-700" size={16} />}
                          </div>

                              {item}
                            </motion.div>
                          ))}
                        </div>

                        {/* Center Logo */}
                        <motion.div
                          className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden shadow-lg"
                          initial={{ opacity: 1, scale: 1 }}
                          animate={isCliHovering ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <img
                            src="https://framerusercontent.com/images/q43ivjLz67lXhWf6TKfLIh0FY.png"
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>

                        {/* Right Column */}
                        <div className="flex flex-col gap-3">
                          {["AI Training", "Quality Check", "Voice Ready"].map((item, index) => (
                            <motion.div
                              key={`right-${index}`}
                              className="rounded px-3 py-2 flex items-center gap-2 text-sm font-medium shadow-lg"
                              style={{
                                backgroundColor: "#ffffff",
                                color: "#1f2937",
                                border: "1px solid #e5e7eb",
                              }}
                              initial={{ opacity: 1, x: 0 }}
                              animate={isCliHovering ? { x: [20, 0] } : { x: 0 }}
                              transition={{
                                duration: 0.5,
                                delay: index * 0.1,
                              }}
                              whileHover={{ scale: 1.05 }}
                                                        >
                            <div className="w-4 h-4 flex items-center justify-center">
                              {index === 0 && <FaRobot className="text-gray-700" size={16} />}
                              {index === 1 && <FaCheckCircle className="text-green-600" size={16} />}
                              {index === 2 && <FaBullseye className="text-purple-600" size={16} />}
                            </div>
                              {item}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Animated Circular Border */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={isCliHovering ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <svg width="350" height="350" viewBox="0 0 350 350" className="opacity-40">
                        <motion.path
                          d="M 175 1.159 C 271.01 1.159 348.841 78.99 348.841 175 C 348.841 271.01 271.01 348.841 175 348.841 C 78.99 348.841 1.159 271.01 1.159 175 C 1.159 78.99 78.99 1.159 175 1.159 Z"
                          stroke="rgba(255, 255, 255, 0.38)"
                          strokeWidth="1.16"
                          fill="transparent"
                          strokeDasharray="4 4"
                          initial={{ pathLength: 0, rotate: 0 }}
                          animate={isCliHovering ? { pathLength: 1, rotate: 360 } : { pathLength: 0, rotate: 0 }}
                          transition={{
                            pathLength: { duration: 3, ease: "easeInOut" },
                            rotate: {
                              duration: 20,
                              repeat: isCliHovering ? Number.POSITIVE_INFINITY : 0,
                              ease: "linear",
                            },
                          }}
                        />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Avatar Creation Feature */}
              {/* Avatar Creation Feature */}
<motion.div
  className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-8"
  onMouseEnter={() => setIsHovering(true)}
  onMouseLeave={() => setIsHovering(false)}
  ref={ref}
  initial={{ opacity: 0, y: 50 }}
  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
  transition={{ duration: 0.5, delay: 0.5 }}
  whileHover={{
    scale: 1.02,
    borderColor: "rgba(231, 138, 83, 0.6)",
    boxShadow: "0 0 30px rgba(231, 138, 83, 0.2)",
  }}
  style={{ transition: "all 0s ease-in-out" }}
>
  <div className="flex flex-col gap-4">
    <h3 className="text-2xl leading-none font-semibold tracking-tight">Avatar Creation</h3>
    <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
      <p className="max-w-[460px]">
        Create your digital identity from a simple video sample. Our AI generates a realistic avatar that
        represents you.
      </p>
    </div>
  </div>
  <div className="pointer-events-none flex grow items-center justify-center select-none relative">
    <div
      className="relative w-full h-[400px] rounded-xl overflow-hidden"
      style={{ borderRadius: "20px" }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://framerusercontent.com/images/UjqUIiBHmIcSH9vos9HlG2BF4bo.png"
          alt="Avatar-Creation-Background"
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {/* Animated SVG Connecting Lines */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={isHovering ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <svg width="100%" height="100%" viewBox="0 0 121 94" className="absolute">
          <motion.path
            d="M 60.688 1.59 L 60.688 92.449 M 60.688 92.449 L 119.368 92.449 M 60.688 92.449 L 1.414 92.449"
            stroke="rgb(255,222,213)"
            fill="transparent"
            strokeDasharray="2 2"
            initial={{ pathLength: 0 }}
            animate={isHovering ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{
              duration: 2,
              ease: "easeInOut",
            }}
          />
        </svg>
        <svg width="100%" height="100%" viewBox="0 0 121 94" className="absolute">
          <motion.path
            d="M 60.688 92.449 L 60.688 1.59 M 60.688 1.59 L 119.368 1.59 M 60.688 1.59 L 1.414 1.59"
            stroke="rgb(255,222,213)"
            fill="transparent"
            strokeDasharray="2 2"
            initial={{ pathLength: 0 }}
            animate={isHovering ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{
              duration: 2,
              delay: 0.5,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      {/* Animated Purple Blur Effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-16 h-16 bg-purple-500 rounded-full blur-[74px] opacity-65 transform -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 1 }}
        animate={isHovering ? { scale: [1, 1.342, 1, 1.342] } : { scale: 1 }}
        transition={{
          duration: 3,
          ease: "easeInOut",
          repeat: isHovering ? Number.POSITIVE_INFINITY : 0,
          repeatType: "loop",
        }}
      />

      {/* Main Content Container with Staggered Animations */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-3">
            {["Video Input", "Face Analysis", "Expression Map"].map((item, index) => (
              <motion.div
                key={`left-${index}`}
                className="rounded px-3 py-2 flex items-center gap-2 text-sm font-medium shadow-lg"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#1f2937",
                  border: "1px solid #e5e7eb",
                }}
                initial={{ opacity: 1, x: 0 }}
                animate={isHovering ? { x: [-20, 0] } : { x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {index === 0 && (
                    <svg className="text-gray-700" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="14" x="2" y="3" rx="2"/>
                      <circle cx="8" cy="10" r="2"/>
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="text-gray-700" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3c0 1.5-1.5 3-3 3s-3-1.5-3-3a3 3 0 0 0-6 0c0 6 4 10 12 10s12-4 12-10a3 3 0 0 0-6 0c0 1.5-1.5 3-3 3s-3-1.5-3-3a3 3 0 0 0-3-3"/>
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="text-gray-700" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c.552 0 1-.448 1-1V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6c0 .552.448 1 1 1"/>
                    </svg>
                  )}
                </div>
                {item}
              </motion.div>
            ))}
          </div>

          {/* Center Avatar Icon/Logo */}
<motion.div
  className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-black"
  initial={{ opacity: 1, scale: 1 }}
  animate={isHovering ? { scale: [1, 1.1, 1] } : { scale: 1 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
  whileHover={{ scale: 1.1, rotate: 5 }}
>
  <svg
    className="w-10 h-10 text-white"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
</motion.div>


          {/* Right Column */}
          <div className="flex flex-col gap-3">
            {["3D Modeling", "Texture Gen", "Avatar Ready"].map((item, index) => (
              <motion.div
                key={`right-${index}`}
                className="rounded px-3 py-2 flex items-center gap-2 text-sm font-medium shadow-lg"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#1f2937",
                  border: "1px solid #e5e7eb",
                }}
                initial={{ opacity: 1, x: 0 }}
                animate={isHovering ? { x: [20, 0] } : { x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {index === 0 && (
                    <svg className="text-blue-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="text-green-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="18" x="3" y="3" rx="2"/>
                      <path d="m9 9 5 12 1.774-5.226L21 14 9 9z"/>
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="text-purple-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c.552 0 1-.448 1-1V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6c0 .552.448 1 1 1"/>
                    </svg>
                  )}
                </div>
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Animated Circular Border */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={isHovering ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <svg width="350" height="350" viewBox="0 0 350 350" className="opacity-40">
          <motion.path
            d="M 175 1.159 C 271.01 1.159 348.841 78.99 348.841 175 C 348.841 271.01 271.01 348.841 175 348.841 C 78.99 348.841 1.159 271.01 1.159 175 C 1.159 78.99 78.99 1.159 175 1.159 Z"
            stroke="rgba(255, 255, 255, 0.38)"
            strokeWidth="1.16"
            fill="transparent"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, rotate: 0 }}
            animate={isHovering ? { pathLength: 1, rotate: 360 } : { pathLength: 0, rotate: 0 }}
            transition={{
              pathLength: { duration: 3, ease: "easeInOut" },
              rotate: {
                duration: 20,
                repeat: isHovering ? Number.POSITIVE_INFINITY : 0,
                ease: "linear",
              },
            }}
          />
        </svg>
      </motion.div>
    </div>
  </div>
</motion.div>
              {/* AI Content Enhancement Feature */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-2"
                onMouseEnter={() => setIsFeature3Hovering(true)}
                onMouseLeave={() => setIsFeature3Hovering(false)}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(231, 138, 83, 0.5)",
                  boxShadow: "0 0 30px rgba(231, 138, 83, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">AI Content Enhancement</h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Intelligent Urdu script refinement that enhances your text for better pronunciation and natural
                      flow.
                    </p>
                  </div>
                </div>
                <div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
                  <div className="w-full max-w-lg">
                    <div className="relative rounded-2xl border border-white/10 bg-black/20 dark:bg-white/5 backdrop-blur-sm">
                      <div className="p-4">
                        <textarea
                          className="w-full min-h-[100px] bg-transparent border-none text-white placeholder:text-white/50 resize-none focus:outline-none text-base leading-relaxed"
                          placeholder="Enter Urdu text for enhancement..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                      </div>
                      <div className="flex items-center justify-between px-4 pb-4">
                        <div className="flex items-center gap-3">
                          <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white/70"
                            >
                              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e78a53] hover:bg-[#e78a53]/90 transition-colors text-white font-medium">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                            Enhance
                          </button>
                        </div>
                        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white/70"
                          >
                            <path d="m22 2-7 20-4-9-9-4Z"></path>
                            <path d="M22 2 11 13"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Lip-Synced Video Generation Feature */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-8"
                onMouseEnter={() => setIsFeature4Hovering(true)}
                onMouseLeave={() => setIsFeature4Hovering(false)}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                whileHover={{
                  rotateY: 5,
                  rotateX: 2,
                  boxShadow: "0 20px 40px rgba(231, 138, 83, 0.3)",
                  borderColor: "rgba(231, 138, 83, 0.6)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">Lip-Synced Video Generation</h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Advanced lip synchronization technology that creates perfectly matched mouth movements for
                      natural-looking videos.
                    </p>
                  </div>
                </div>
                <div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
                  <div className="relative w-full max-w-sm">
                    <img
                      src="/lipsync-removebg-preview.png"
                      alt="Lip Sync Video Generation"
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
