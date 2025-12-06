"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import ProgressIndicator from "@/components/create-content/ProgressIndicator"
import LanguageSelection from "@/components/create-content/LanguageSelection"
import ScriptMethodSelection from "@/components/create-content/ScriptMethodSelection"
import ScriptRefinement from "@/components/create-content/ScriptRefinement"
import ScriptGeneration from "@/components/create-content/ScriptGeneration"
import ScriptReview from "@/components/create-content/ScriptReview"
import PlaceholderStage from "@/components/create-content/PlaceholderStage"
import { ContentState, Stage } from "@/components/create-content/types"

export default function CreateContentPage() {
  const { getToken } = useAuth()
  const [stage, setStage] = useState<Stage>("language")
  const [contentState, setContentState] = useState<ContentState>({
    language: "",
    method: null,
    scriptId: null,
    generatedScript: null,
    parameters: {},
  })

  const updateState = (updates: Partial<ContentState>) => {
    setContentState((prev) => ({ ...prev, ...updates }))
  }

  const renderStage = () => {
    switch (stage) {
      case "language":
        return (
          <LanguageSelection
            onSelect={(language) => {
              updateState({ language })
              setStage("method")
            }}
          />
        )
      case "method":
        return (
          <ScriptMethodSelection
            onSelect={(method) => {
              updateState({ method })
              setStage(method === "refinement" ? "refinement" : "generation")
            }}
            onBack={() => setStage("language")}
          />
        )
      case "refinement":
        return (
          <ScriptRefinement
            language={contentState.language}
            getToken={getToken}
            onComplete={(scriptId, script, parameters) => {
              updateState({ scriptId, generatedScript: script, parameters })
              setStage("review")
            }}
            onBack={() => setStage("method")}
          />
        )
      case "generation":
        return (
          <ScriptGeneration
            language={contentState.language}
            getToken={getToken}
            onComplete={(scriptId, script, parameters) => {
              updateState({ scriptId, generatedScript: script, parameters })
              setStage("review")
            }}
            onBack={() => setStage("method")}
          />
        )
      case "review":
        return (
          <ScriptReview
            scriptId={contentState.scriptId!}
            script={contentState.generatedScript!}
            language={contentState.language}
            parameters={contentState.parameters}
            getToken={getToken}
            onProceed={() => setStage("tts")}
            onRegenerate={() => setStage(contentState.method === "refinement" ? "refinement" : "generation")}
            onUpdateScript={(newScript) => updateState({ generatedScript: newScript })}
          />
        )
      case "tts":
        return (
          <PlaceholderStage
            title="Text-to-Speech"
            icon="???"
            description="Transform your script into natural-sounding voice narration."
            onBack={() => setStage("review")}
            onNext={() => setStage("video")}
          />
        )
      case "video":
        return (
          <PlaceholderStage
            title="Video generation"
            icon="??"
            description="Create stunning visuals to pair with your voiceover."
            onBack={() => setStage("tts")}
          />
        )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Content pipeline</p>
            <h1 className="text-3xl font-bold">Create content</h1>
            <p className="text-white/70">A guided, multi-stage flow that mirrors the rest of the dashboard.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {contentState.language && <Badge className="bg-primary/20 text-primary">{contentState.language}</Badge>}
            {contentState.method && <Badge variant="outline" className="border-white/20 text-white/80">{contentState.method}</Badge>}
          </div>
        </div>

        <ProgressIndicator currentStage={stage} />

        <div className="relative">{renderStage()}</div>
      </div>
    </DashboardLayout>
  )
}
