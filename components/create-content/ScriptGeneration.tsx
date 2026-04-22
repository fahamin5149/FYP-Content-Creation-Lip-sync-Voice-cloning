"use client"

import { useEffect, useState } from "react"
import { generateScript, ScriptGenerationParams, ScriptResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  DEFAULT_SCRIPT_GENERATION_FORM_DRAFT,
  type ScriptGenerationFormDraft,
} from "@/components/create-content/types"

interface ScriptGenerationProps {
  language: string
  getToken: () => Promise<string | null>
  initialDraft?: Partial<ScriptGenerationFormDraft> | null
  onDraftChange?: (draft: ScriptGenerationFormDraft) => void
  onComplete: (scriptId: string, script: string, params: any) => void
}

const durationOptions = [
  { value: 30, label: "30s" },
  { value: 60, label: "1 min" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
]
const scriptStyles = [
  "Educational",
  "Entertainment",
  "Tutorial",
  "Review",
  "Storytelling",
  "News/Update",
  "Promotional",
  "Interview Style",
]
export default function ScriptGeneration({
  language,
  getToken,
  initialDraft,
  onDraftChange,
  onComplete,
}: ScriptGenerationProps) {
  const [form, setForm] = useState<ScriptGenerationFormDraft>(() => ({
    ...DEFAULT_SCRIPT_GENERATION_FORM_DRAFT,
    ...initialDraft,
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const getFriendlyError = (err: unknown) => {
    const fallback = "Could not generate the script right now. Please try again."
    if (!(err instanceof Error) || !err.message) return fallback
    try {
      const parsed = JSON.parse(err.message) as { code?: string; message?: string }
      if (parsed?.code === "UNSAFE_CONTENT_DENIED") return parsed.message || fallback
    } catch {
      // non-json
    }
    return fallback
  }

  useEffect(() => {
    onDraftChange?.(form)
  }, [form, onDraftChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.topic.trim() || !form.targetAudience.trim()) {
      setError("Title, topic, and target audience are required.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const params: ScriptGenerationParams = {
        title: form.title,
        language,
        topic: form.topic.trim(),
        styleTone: form.styleTone?.trim() || undefined,
        targetAudience: form.targetAudience,
        keyPoints: form.keyPoints?.trim() || undefined,
        duration: form.duration,
        generateExactlyOneSentence: form.generateOneSentence,
      }
      const response: ScriptResponse = await generateScript(params, getToken)
      onComplete(response.scriptId, response.content, params)
    } catch (err) {
      const msg = getFriendlyError(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Generate a new script</CardTitle>
        <CardDescription className="text-white/70">
          Provide the creative brief and we’ll build a structured script for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white">Content Title *</Label>
          <Input
            placeholder="e.g., Social Media Marketing Tutorial"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="bg-black/40 text-white border-white/10"
          />
          <p className="text-xs text-white/50">This title helps you identify your content in the dashboard</p>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Topic (include sub-topic if needed)</Label>
          <Textarea
            placeholder="e.g., Short-form video growth: hooks, pacing, and retention"
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            className="bg-black/40 text-white border-white/10 min-h-[80px] resize-y"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Script Style</Label>
          <Select value={form.styleTone} onValueChange={(v) => setForm((f) => ({ ...f, styleTone: v }))}>
            <SelectTrigger className="w-full bg-black/40 text-white border-white/10">
              <SelectValue placeholder="Select script style" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 text-white border-white/10">
              {scriptStyles.map((style) => (
                <SelectItem key={style} value={style}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Target audience</Label>
          <Input
            placeholder="e.g., Beginner creators, marketing teams"
            value={form.targetAudience}
            onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))}
            className="bg-black/40 text-white border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Key points</Label>
          <Textarea
            placeholder="Add bullet points/themes. If you want a specific tone, mention it here."
            value={form.keyPoints}
            onChange={(e) => setForm((f) => ({ ...f, keyPoints: e.target.value }))}
            className="min-h-[120px] bg-black/40 text-white border-white/10"
          />
        </div>

        <div className="space-y-2">
          <div className="space-y-2">
            <Label className="text-white">Duration</Label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, duration: opt.value }))}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    form.duration === opt.value
                      ? "border-primary bg-primary/15 text-white"
                      : "border-white/15 bg-black/20 text-white/80 hover:border-white/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <Checkbox
              checked={form.generateOneSentence}
              onCheckedChange={(val) => setForm((f) => ({ ...f, generateOneSentence: Boolean(val) }))}
            />
            Generate exactly 1 sentence
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating...
            </span>
          ) : (
            "Generate script"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
