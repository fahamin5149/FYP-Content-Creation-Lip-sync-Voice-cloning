"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import ProgressIndicator from "@/components/create-content/ProgressIndicator"
import LanguageSelection from "@/components/create-content/LanguageSelection"
import ScriptMethodSelection from "@/components/create-content/ScriptMethodSelection"
import ScriptRefinement from "@/components/create-content/ScriptRefinement"
import ScriptGeneration from "@/components/create-content/ScriptGeneration"
import ScriptPassthrough from "@/components/create-content/ScriptPassthrough"
import ScriptReview from "@/components/create-content/ScriptReview"
import PlaceholderStage from "@/components/create-content/PlaceholderStage"
import { ContentState, Stage } from "@/components/create-content/types"
import { getScriptById } from "@/lib/api"

export default function CreateContentPage() {
  const { getToken } = useAuth()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draftId')
  
  const [stage, setStage] = useState<Stage>("language")
  const [contentState, setContentState] = useState<ContentState>({
    language: "",
    method: null,
    scriptId: null,
    generatedScript: null,
    parameters: {},
  })
  const [loadingDraft, setLoadingDraft] = useState(!!draftId)

  useEffect(() => {
    if (draftId) {
      loadDraft(draftId)
    }
  }, [draftId])

  const loadDraft = async (scriptId: string) => {
    try {
      setLoadingDraft(true)
      const draft = await getScriptById(scriptId, getToken)
      
      // Restore the state from the draft
      updateState({
        language: draft.language,
        method: draft.method,
        scriptId: draft.script_id,
        generatedScript: draft.content,
        parameters: draft.parameters || {}
      })
      
      // Navigate to review stage since draft is already a script
      setStage("review")
    } catch (error) {
      console.error('Error loading draft:', error)
      // If draft loading fails, start fresh
      setStage("language")
    } finally {
      setLoadingDraft(false)
    }
  }

  const updateState = (updates: Partial<ContentState>) => {
    setContentState((prev) => ({ ...prev, ...updates }))
  }

  if (loadingDraft) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-white/80">Loading your draft...</p>
          </div>
        </div>
      </DashboardLayout>
    )
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
              if (method === "passthrough") {
                setStage("passthrough")
              } else {
                setStage(method === "refinement" ? "refinement" : "generation")
              }
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
      case "passthrough":
        return (
          <ScriptPassthrough
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
            onRegenerate={() => {
              if (contentState.method === "passthrough") {
                setStage("passthrough")
              } else {
                setStage(contentState.method === "refinement" ? "refinement" : "generation")
              }
            }}
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
