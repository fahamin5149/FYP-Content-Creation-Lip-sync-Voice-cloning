"use client"

import { cn } from "@/lib/utils"

const steps = [
  { key: "language", label: "Language" },
  { key: "method", label: "Method" },
  { key: "script", label: "Script" },
  { key: "review", label: "Review" },
  { key: "tts", label: "TTS" },
  { key: "video", label: "Video" },
] as const

interface ProgressIndicatorProps {
  activeStepIndex: number
  maxReachableIndex: number
  onStepClick: (stepIndex: number) => void
}

export default function ProgressIndicator({
  activeStepIndex,
  maxReachableIndex,
  onStepClick,
}: ProgressIndicatorProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner">
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, index) => {
          const isActive = index === activeStepIndex
          const isCompleted = index < activeStepIndex
          const canNavigate = index <= maxReachableIndex

          return (
            <div key={step.key} className="flex items-center gap-3">
              <button
                type="button"
                disabled={!canNavigate}
                title={
                  canNavigate
                    ? `Go to ${step.label}`
                    : "Complete earlier steps in the pipeline first"
                }
                onClick={() => canNavigate && onStepClick(index)}
                className={cn(
                  "flex h-8 min-w-[110px] items-center justify-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide transition",
                  !canNavigate && "cursor-not-allowed opacity-40",
                  canNavigate && "cursor-pointer hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
                    : isCompleted
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-white/60 border border-white/10"
                )}
              >
                {step.label}
              </button>
              {index !== steps.length - 1 && (
                <span className="text-white/30" aria-hidden>
                  →
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
