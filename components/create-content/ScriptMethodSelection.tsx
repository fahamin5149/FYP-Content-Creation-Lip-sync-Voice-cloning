"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, PenLine, Sparkles } from "lucide-react"

interface ScriptMethodSelectionProps {
  onSelect: (method: "refinement" | "generation") => void
  onBack: () => void
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
]

export default function ScriptMethodSelection({ onSelect, onBack }: ScriptMethodSelectionProps) {
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">How do you want to start?</CardTitle>
          <CardDescription className="text-white/70">
            Bring your own draft or let the AI generate one from scratch.
          </CardDescription>
        </div>
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {methods.map((method) => {
          const Icon = method.icon
          return (
            <button
              key={method.key}
              onClick={() => onSelect(method.key)}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20"
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
                <span className="text-sm font-semibold text-primary">Select</span>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
