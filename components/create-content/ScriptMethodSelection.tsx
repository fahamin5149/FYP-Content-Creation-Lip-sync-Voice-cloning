"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PenLine, Sparkles, FileText } from "lucide-react"

interface ScriptMethodSelectionProps {
  selectedMethod?: "refinement" | "generation" | "passthrough"
  onSelect: (method: "refinement" | "generation" | "passthrough") => void
}

const methods = [
  {
    key: "refinement" as const,
    title: "Refine my script",
    description: "Polish an existing draft with smart editing cues.",
    icon: PenLine,
  },
  {
    key: "generation" as const,
    title: "Generate new script",
    description: "Create a fresh script with guided inputs.",
    icon: Sparkles,
  },
  {
    key: "passthrough" as const,
    title: "Use my own script",
    description: "Use your own script as-is — no AI modifications.",
    icon: FileText,
  },
]

export default function ScriptMethodSelection({ selectedMethod, onSelect }: ScriptMethodSelectionProps) {
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">How do you want to start?</CardTitle>
        <CardDescription className="text-white/70">
          Bring your own draft or let the AI generate one from scratch. Use the progress bar any time to move between
          steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        {methods.map((method) => {
          const Icon = method.icon
          const isSelected = selectedMethod === method.key
          return (
            <button
              key={method.key}
              type="button"
              onClick={() => onSelect(method.key)}
              className={cn(
                "group relative overflow-hidden rounded-xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg",
                isSelected
                  ? "border-primary bg-primary/15 ring-2 ring-primary/35 shadow-primary/20"
                  : "border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:border-primary/60 hover:shadow-primary/20"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-80" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-lg font-semibold text-white">{method.title}</span>
                </div>
                <p className="text-sm text-white/70">{method.description}</p>
                <span className="text-sm font-semibold text-primary">{isSelected ? "Selected · continue below" : "Select"}</span>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
