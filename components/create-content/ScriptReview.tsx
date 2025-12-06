"use client"

import { useEffect, useMemo, useState } from "react"
import { ScriptResponse, saveDraft, refineWithFeedback } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import FeedbackModal from "./FeedbackModal"
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react"

interface ScriptReviewProps {
  scriptId: string
  script: string
  language: string
  parameters: any
  getToken: () => Promise<string | null>
  onProceed: () => void
  onRegenerate: () => void
  onUpdateScript: (newScript: string) => void
}

const quickActions = [
  { label: "Make it shorter", feedback: "Please make the script shorter while keeping the key points." },
  { label: "Make it longer", feedback: "Expand the script with more depth and detail." },
  { label: "Simplify language", feedback: "Simplify the language and make it easier to follow." },
  { label: "Add more details", feedback: "Add more details and examples to enrich the script." },
]

export default function ScriptReview({ scriptId, script, language, parameters, getToken, onProceed, onRegenerate, onUpdateScript }: ScriptReviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedScript, setEditedScript] = useState(script)
  const [saving, setSaving] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEditedScript(script)
  }, [script])

  const wordCount = useMemo(() => script.trim().split(/\s+/).filter(Boolean).length, [script])
  const estimatedDuration = parameters?.duration || Math.max(30, Math.ceil(wordCount / 2))
  const isUrdu = language?.toLowerCase() === "urdu"

  const handleSaveDraft = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const result = await saveDraft(scriptId, isEditing ? editedScript : script, parameters, getToken)
      if (!result.success) throw new Error("save failed")
      setMessage("Draft saved")
    } catch (err) {
      setError("Unable to save draft right now.")
    } finally {
      setSaving(false)
    }
  }

  const runFeedback = async (feedback: string) => {
    setLoadingAction(feedback)
    setError(null)
    setMessage(null)
    try {
      const response: ScriptResponse = await refineWithFeedback(
        {
          scriptId,
          currentScript: isEditing ? editedScript : script,
          feedback,
          language,
          duration: parameters?.duration,
          pacing: parameters?.pacing,
        },
        getToken
      )
      onUpdateScript(response.content)
      setMessage("Updated with feedback")
      setIsEditing(false)
    } catch (err) {
      setError("Could not apply that refinement.")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl">Review your script</CardTitle>
          <CardDescription className="text-white/70">
            Inspect, tweak, or request a new pass before moving to audio.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary/20 text-primary">{language || "Language"}</Badge>
          <Badge variant="outline" className="border-white/20 text-white/80">{parameters?.pacing || "Pacing"}</Badge>
          <Badge variant="outline" className="border-white/20 text-white/80">{parameters?.duration ? `${parameters.duration}s` : "Duration"}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-white/70">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Word count: {wordCount}</div>
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Estimated duration: {estimatedDuration}s</div>
        </div>

        <div
          className="rounded-xl border border-white/10 bg-black/40 p-4"
          style={isUrdu ? { direction: "rtl", textAlign: "right" } : {}}
        >
          {isEditing ? (
            <Textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              className="min-h-[260px] bg-black/60 text-white border-white/10"
            />
          ) : (
            <pre className="whitespace-pre-wrap break-words text-base leading-relaxed text-white/90">{script}</pre>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant="secondary"
              className="bg-white/10 text-white"
              disabled={!!loadingAction}
              onClick={() => runFeedback(action.feedback)}
            >
              {loadingAction === action.feedback ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Working</span>
              ) : (
                action.label
              )}
            </Button>
          ))}
          <FeedbackModal
            trigger={
              <Button size="sm" variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
                Refine with feedback
              </Button>
            }
            onSubmit={(fb) => runFeedback(fb)}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        {message && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-3 justify-between px-6">
        <div className="flex gap-3">
          <Button variant="ghost" className="text-white/70 hover:text-white" onClick={onRegenerate}>
            Regenerate
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => setIsEditing((prev) => !prev)}
          >
            {isEditing ? "Finish editing" : "Edit manually"}
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save draft"}
          </Button>
        </div>
        <Button
          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
          onClick={() => {
            if (isEditing) onUpdateScript(editedScript)
            onProceed()
          }}
        >
          Accept & proceed
        </Button>
      </CardFooter>
    </Card>
  )
}
