"use client"

import { useState } from "react"
import { refineScript, ScriptRefinementParams, ScriptResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

interface ScriptRefinementProps {
  language: string
  getToken: () => Promise<string | null>
  onComplete: (scriptId: string, script: string, params: any) => void
  onBack: () => void
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

export default function ScriptRefinement({ language, getToken, onComplete, onBack }: ScriptRefinementProps) {
  const [originalScript, setOriginalScript] = useState("")
  const [refinementType, setRefinementType] = useState<"simple" | "custom">("simple")
  const [customInstructions, setCustomInstructions] = useState("")
  const [duration, setDuration] = useState<number>(60)
  const [pacing, setPacing] = useState<string>("Medium")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!originalScript.trim()) {
      setError("Please paste your script first.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const params: ScriptRefinementParams = {
        originalScript,
        refinementType,
        customInstructions: refinementType === "custom" ? customInstructions : undefined,
        language,
        duration,
        pacing,
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Refine your script</CardTitle>
          <CardDescription className="text-white/70">
            Drop in your draft and choose how you want it polished.
          </CardDescription>
        </div>
        <Button variant="ghost" className="text-white/70 hover:text-white" onClick={onBack}>
          Back
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white">Original script</Label>
          <Textarea
            placeholder="Paste your script here..."
            value={originalScript}
            onChange={(e) => setOriginalScript(e.target.value)}
            className="min-h-[180px] bg-black/40 text-white border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Refinement type</Label>
          <RadioGroup
            value={refinementType}
            onValueChange={(value: "simple" | "custom") => setRefinementType(value)}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <RadioGroupItem value="simple" id="simple" />
              <div>
                <p className="font-medium">Simple refinement</p>
                <p className="text-sm text-white/70">Tighten language and flow automatically.</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <RadioGroupItem value="custom" id="custom" />
              <div>
                <p className="font-medium">Custom instructions</p>
                <p className="text-sm text-white/70">Provide specific guidance for the rewrite.</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {refinementType === "custom" && (
          <div className="space-y-2">
            <Label className="text-white">Custom instructions</Label>
            <Textarea
              placeholder="Tell the model exactly what to change..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="min-h-[120px] bg-black/40 text-white border-white/10"
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-white">Duration</Label>
            <Select value={String(duration)} onValueChange={(val) => setDuration(Number(val))}>
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
            <Select value={pacing} onValueChange={(val) => setPacing(val)}>
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
      <CardFooter className="flex justify-between px-6">
        <Button variant="ghost" className="text-white/70 hover:text-white" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
        >
          {loading ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Refining...</span>
          ) : (
            "Refine script"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
