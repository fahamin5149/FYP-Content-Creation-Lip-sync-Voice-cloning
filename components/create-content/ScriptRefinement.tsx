"use client"

import { useEffect, useState } from "react"
import { refineScript, ScriptRefinementParams, ScriptResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, Loader2 } from "lucide-react"
import {
  DEFAULT_SCRIPT_REFINEMENT_FORM_DRAFT,
  type ScriptRefinementFormDraft,
} from "@/components/create-content/types"

interface ScriptRefinementProps {
  language: string
  getToken: () => Promise<string | null>
  initialDraft?: Partial<ScriptRefinementFormDraft> | null
  onDraftChange?: (draft: ScriptRefinementFormDraft) => void
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

const pacingOptions = ["Slow", "Medium", "Fast"]

export default function ScriptRefinement({
  language,
  getToken,
  initialDraft,
  onDraftChange,
  onComplete,
}: ScriptRefinementProps) {
  const [form, setForm] = useState<ScriptRefinementFormDraft>(() => ({
    ...DEFAULT_SCRIPT_REFINEMENT_FORM_DRAFT,
    ...initialDraft,
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onDraftChange?.(form)
  }, [form, onDraftChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.originalScript.trim()) {
      setError("Title and script are required.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const params: ScriptRefinementParams = {
        title: form.title,
        originalScript: form.originalScript,
        refinementType: form.refinementType,
        customInstructions: form.refinementType === "custom" ? form.customInstructions : undefined,
        language,
        duration: form.duration,
        pacing: form.pacing,
      }
      const response: ScriptResponse = await refineScript(params, getToken)
      onComplete(response.scriptId, response.content, params)
    } catch (err) {
      setError("Could not refine the script right now. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Refine your script</CardTitle>
        <CardDescription className="text-white/70">
          Drop in your draft and choose how you want it polished.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white">Content Title *</Label>
          <Input
            placeholder="e.g., Refined Marketing Script"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="bg-black/40 text-white border-white/10"
          />
          <p className="text-xs text-white/50">This title helps you identify your content in the dashboard</p>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Original script</Label>
          <Textarea
            placeholder="Paste your script here..."
            value={form.originalScript}
            onChange={(e) => setForm((f) => ({ ...f, originalScript: e.target.value }))}
            className="min-h-[180px] bg-black/40 text-white border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Refinement type</Label>
          <RadioGroup
            value={form.refinementType}
            onValueChange={(value: "simple" | "custom") => setForm((f) => ({ ...f, refinementType: value }))}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <RadioGroupItem value="simple" id="simple" className="mt-0" />
              <div>
                <p className="font-medium">Simple refinement</p>
                <p className="text-sm text-white/70">Tighten language and flow automatically.</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <RadioGroupItem value="custom" id="custom" className="mt-0" />
              <div>
                <p className="font-medium">Custom instructions</p>
                <p className="text-sm text-white/70">Provide specific guidance for the rewrite.</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {form.refinementType === "custom" && (
          <div className="space-y-2">
            <Label className="text-white">Custom instructions</Label>
            <Textarea
              placeholder="Tell the model exactly what to change..."
              value={form.customInstructions}
              onChange={(e) => setForm((f) => ({ ...f, customInstructions: e.target.value }))}
              className="min-h-[120px] bg-black/40 text-white border-white/10"
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-white">Duration</Label>
            <Select
              value={String(form.duration)}
              onValueChange={(val) => setForm((f) => ({ ...f, duration: Number(val) }))}
            >
              <SelectTrigger className="w-full bg-black/40 text-white border-white/10">
                <SelectValue placeholder="Choose duration" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-white/10">
                {durationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white">Pacing</Label>
            <Select value={form.pacing} onValueChange={(val) => setForm((f) => ({ ...f, pacing: val }))}>
              <SelectTrigger className="w-full bg-black/40 text-white border-white/10">
                <SelectValue placeholder="Select pacing" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-white/10">
                {pacingOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end px-6">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Refining...
            </span>
          ) : (
            "Refine script"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
