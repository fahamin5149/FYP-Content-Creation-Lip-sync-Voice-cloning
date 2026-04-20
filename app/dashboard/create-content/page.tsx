"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import ProgressIndicator from "@/components/create-content/ProgressIndicator"
import LanguageSelection from "@/components/create-content/LanguageSelection"
import ScriptMethodSelection from "@/components/create-content/ScriptMethodSelection"
import ScriptRefinement from "@/components/create-content/ScriptRefinement"
import ScriptGeneration from "@/components/create-content/ScriptGeneration"
import ScriptPassthrough from "@/components/create-content/ScriptPassthrough"
import ScriptReview from "@/components/create-content/ScriptReview"
import TTSStage from "@/components/create-content/TTSStage"
import VideoStage from "@/components/create-content/VideoStage"
import type {
  ContentState,
  ScriptGenerationFormDraft,
  ScriptPassthroughFormDraft,
  ScriptRefinementFormDraft,
  Stage,
} from "@/components/create-content/types"
import {
  getActiveStepIndex,
  maxReachableStepIndex,
  stepIndexToStage,
} from "@/components/create-content/pipelineNavigation"
import { getScriptById } from "@/lib/api"

export default function CreateContentPage() {
  const { getToken } = useAuth()
  const searchParams = useSearchParams()
  const draftId = searchParams.get("draftId")

  const [stage, setStage] = useState<Stage>("language")
  const [contentState, setContentState] = useState<ContentState>({
    language: "",
    method: null,
    scriptId: null,
    generatedScript: null,
    parameters: {},
    ttsJobId: null,
    scriptFormDrafts: {},
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

      updateState({
        language: draft.language,
        method: draft.method,
        scriptId: draft.script_id,
        generatedScript: draft.content,
        parameters: draft.parameters || {},
      })

      setStage("review")
    } catch (error) {
      console.error("Error loading draft:", error)
      setStage("language")
    } finally {
      setLoadingDraft(false)
    }
  }

  const updateState = (updates: Partial<ContentState>) => {
    setContentState((prev) => ({ ...prev, ...updates }))
  }

  const persistGenerationDraft = useCallback((draft: ScriptGenerationFormDraft) => {
    setContentState((prev) => ({
      ...prev,
      scriptFormDrafts: { ...prev.scriptFormDrafts, generation: draft },
    }))
  }, [])

  const persistRefinementDraft = useCallback((draft: ScriptRefinementFormDraft) => {
    setContentState((prev) => ({
      ...prev,
      scriptFormDrafts: { ...prev.scriptFormDrafts, refinement: draft },
    }))
  }, [])

  const persistPassthroughDraft = useCallback((draft: ScriptPassthroughFormDraft) => {
    setContentState((prev) => ({
      ...prev,
      scriptFormDrafts: { ...prev.scriptFormDrafts, passthrough: draft },
    }))
  }, [])

  const maxReachable = useMemo(() => maxReachableStepIndex(contentState), [contentState])
  const activeStepIndex = useMemo(() => getActiveStepIndex(stage), [stage])

  const navigateToStep = useCallback(
    (index: number) => {
      if (index > maxReachable) return
      const next = stepIndexToStage(index, contentState)
      if (next) setStage(next)
    },
    [contentState, maxReachable]
  )

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
            selectedLanguage={contentState.language || undefined}
            onSelect={(language) => {
              updateState({ language })
              setStage("method")
            }}
          />
        )
      case "method":
        return (
          <ScriptMethodSelection
            selectedMethod={contentState.method ?? undefined}
            onSelect={(method) => {
              updateState({ method })
              if (method === "passthrough") {
                setStage("passthrough")
              } else {
                setStage(method === "refinement" ? "refinement" : "generation")
              }
            }}
          />
        )
      case "refinement":
        return (
          <ScriptRefinement
            language={contentState.language}
            getToken={getToken}
            initialDraft={contentState.scriptFormDrafts?.refinement}
            onDraftChange={persistRefinementDraft}
            onComplete={(scriptId, script, parameters) => {
              updateState({ scriptId, generatedScript: script, parameters })
              setStage("review")
            }}
          />
        )
      case "generation":
        return (
          <ScriptGeneration
            language={contentState.language}
            getToken={getToken}
            initialDraft={contentState.scriptFormDrafts?.generation}
            onDraftChange={persistGenerationDraft}
            onComplete={(scriptId, script, parameters) => {
              updateState({ scriptId, generatedScript: script, parameters })
              setStage("review")
            }}
          />
        )
      case "passthrough":
        return (
          <ScriptPassthrough
            language={contentState.language}
            getToken={getToken}
            initialDraft={contentState.scriptFormDrafts?.passthrough}
            onDraftChange={persistPassthroughDraft}
            onComplete={(scriptId, script, parameters) => {
              updateState({ scriptId, generatedScript: script, parameters })
              setStage("review")
            }}
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
          <TTSStage
            script={contentState.generatedScript!}
            language={contentState.language}
            scriptId={contentState.scriptId!}
            getToken={getToken}
            onComplete={(jobId) => {
              updateState({ ttsJobId: jobId })
              setStage("video")
            }}
          />
        )
      case "video":
        return contentState.ttsJobId ? (
          <VideoStage ttsJobId={contentState.ttsJobId} getToken={getToken} />
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/80">
            <p className="mb-4">Complete the TTS step first so we have audio for lip-sync.</p>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setStage("tts")}
            >
              Go to TTS
            </Button>
          </div>
        )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Content pipeline</p>
            <h1 className="text-3xl font-bold">Create content</h1>
            <p className="text-white/70 mt-1">
              Use the progress steps to move through the flow. Your script forms and choices are kept while you
              navigate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {contentState.language && (
              <Badge className="bg-primary/20 text-primary">{contentState.language}</Badge>
            )}
            {contentState.method && (
              <Badge variant="outline" className="border-white/20 text-white/80">
                {contentState.method}
              </Badge>
            )}
          </div>
        </div>

        <ProgressIndicator
          activeStepIndex={activeStepIndex}
          maxReachableIndex={maxReachable}
          onStepClick={navigateToStep}
        />

        <div className="relative">{renderStage()}</div>
      </div>
    </DashboardLayout>
  )
}
