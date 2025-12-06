"use client"

import { useState } from "react"
import { generateScript, ScriptGenerationParams, ScriptResponse } from "@/lib/api"
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
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Loader2 } from "lucide-react"

interface ScriptGenerationProps {
  language: string
  getToken: () => Promise<string | null>
  onComplete: (scriptId: string, script: string, params: any) => void
  onBack: () => void
}

const scriptTypes = [
  "Educational",
  "Entertainment",
  "Tutorial",
  "Review",
  "Storytelling",
  "News/Update",
  "Promotional",
  "Interview Style",
]

const tones = ["Professional", "Casual", "Humorous", "Serious", "Inspirational", "Conversational"]
const introStyles = ["Direct", "Story-based", "Question-based"]
const durationOptions = [
  { value: 30, label: "30s" },
  { value: 60, label: "1 min" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
]
const pacingOptions = ["Slow", "Medium", "Fast"]

export default function ScriptGeneration({ language, getToken, onComplete, onBack }: ScriptGenerationProps) {
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [scriptType, setScriptType] = useState(scriptTypes[0])
  const [tone, setTone] = useState(tones[0])
  const [targetAudience, setTargetAudience] = useState("")
  const [keyPoints, setKeyPoints] = useState("")
  const [duration, setDuration] = useState<number>(60)
  const [pacing, setPacing] = useState<string>("Medium")
  const [introStyle, setIntroStyle] = useState(introStyles[0])
  const [includeHook, setIncludeHook] = useState(false)
  const [includeCTA, setIncludeCTA] = useState(false)
  const [includeTransitions, setIncludeTransitions] = useState(false)
  const [includeQuestions, setIncludeQuestions] = useState(false)
  const [specialRequirements, setSpecialRequirements] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !topic.trim() || !targetAudience.trim()) {
      setError("Title, topic, and target audience are required.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const params: ScriptGenerationParams = {
        title,
        language,
        topic,
        scriptType,
        tone,
        targetAudience,
        keyPoints,
        duration,
        pacing,
        introStyle,
        includeHook,
        includeCTA,
        includeTransitions,
        includeQuestions,
        specialRequirements,
      }
      const response: ScriptResponse = await generateScript(params, getToken)
      onComplete(response.scriptId, response.content, params)
    } catch (err) {
      setError("Could not generate the script right now. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Generate a new script</CardTitle>
          <CardDescription className="text-white/70">
            Provide the creative brief and we’ll build a structured script for you.
          </CardDescription>
        </div>
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onBack}>
          Back
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white">Content Title *</Label>
          <Input
            placeholder="e.g., Social Media Marketing Tutorial"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black/40 text-white border-white/10"
          />
          <p className="text-xs text-white/50">This title helps you identify your content in the dashboard</p>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Topic / Subject</Label>
          <Textarea
            placeholder="e.g., How to create engaging short-form videos"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-black/40 text-white border-white/10 min-h-[60px] resize-y"
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-white">Script type</Label>
            <Select value={scriptType} onValueChange={setScriptType}>
              <SelectTrigger className="w-full bg-black/40 text-white border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-white/10">
                {scriptTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="w-full bg-black/40 text-white border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-white/10">
                {tones.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Target audience</Label>
          <Input
            placeholder="e.g., Beginner creators, marketing teams"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="bg-black/40 text-white border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Key points to cover (optional)</Label>
          <Textarea
            placeholder="Add bullet points or themes you want included"
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            className="min-h-[120px] bg-black/40 text-white border-white/10"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-white">Intro style</Label>
            <Select value={introStyle} onValueChange={setIntroStyle}>
              <SelectTrigger className="w-full bg-black/40 text-white border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-white/10">
                {introStyles.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <Checkbox checked={includeHook} onCheckedChange={(val) => setIncludeHook(Boolean(val))} />
              Include hook
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <Checkbox checked={includeCTA} onCheckedChange={(val) => setIncludeCTA(Boolean(val))} />
              Include CTA
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <Checkbox checked={includeTransitions} onCheckedChange={(val) => setIncludeTransitions(Boolean(val))} />
              Add transitions
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <Checkbox checked={includeQuestions} onCheckedChange={(val) => setIncludeQuestions(Boolean(val))} />
              Include questions
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Special requirements (optional)</Label>
          <Textarea
            placeholder="Any specific tone, brand words, or constraints?"
            value={specialRequirements}
            onChange={(e) => setSpecialRequirements(e.target.value)}
            className="min-h-[100px] bg-black/40 text-white border-white/10"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
        >
          {loading ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating...</span>
          ) : (
            "Generate script"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
