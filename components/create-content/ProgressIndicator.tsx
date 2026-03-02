"use client"

import { cn } from "@/lib/utils"
import { Stage } from "./types"

const steps = [
  { key: "language", label: "Language" },
  { key: "method", label: "Method" },
  { key: "script", label: "Script" },
  { key: "review", label: "Review" },
  { key: "tts", label: "TTS" },
  { key: "video", label: "Video" },
] as const

const mapStageToStep = (stage: Stage) => {
  if (stage === "refinement" || stage === "generation" || stage === "passthrough") return "script"
  return stage
}

interface ProgressIndicatorProps {
  currentStage: Stage
}

export default function ProgressIndicator({ currentStage }: ProgressIndicatorProps) {
  const activeKey = mapStageToStep(currentStage)
  const activeIndex = steps.findIndex((s) => s.key === activeKey)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner">
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, index) => {
          const isActive = index === activeIndex
          const isCompleted = index < activeIndex
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 min-w-[110px] items-center justify-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide transition",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
                    : isCompleted
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-white/60 border border-white/10"
                )}
              >
                {step.label}
              </div>
              {index !== steps.length - 1 && (
                <span className="text-white/30">→</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
