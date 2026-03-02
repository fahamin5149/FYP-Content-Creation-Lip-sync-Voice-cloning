"use client"

import { useState } from "react"
import { saveScriptDirectly, ScriptPassthroughParams, ScriptResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Loader2 } from "lucide-react"

interface ScriptPassthroughProps {
  language: string
  getToken: () => Promise<string | null>
  onComplete: (scriptId: string, script: string, params: any) => void
  onBack: () => void
}

export default function ScriptPassthrough({ language, getToken, onComplete, onBack }: ScriptPassthroughProps) {
  const [title, setTitle] = useState("")
  const [script, setScript] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Please provide a title for your content.")
      return
    }
    if (!script.trim()) {
      setError("Please paste or type your script.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const params: ScriptPassthroughParams = {
        title,
        language,
        content: script,
      }
      const response: ScriptResponse = await saveScriptDirectly(params, getToken)
      onComplete(response.scriptId, response.content, params)
    } catch (err) {
      setError("Could not save your script right now. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Use my own script</CardTitle>
          <CardDescription className="text-white/70">
            Paste or type your script below. It will be saved as-is — no AI modifications.
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
            placeholder="e.g., My Product Review Script"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black/40 text-white border-white/10"
          />
          <p className="text-xs text-white/50">This title helps you identify your content in the dashboard</p>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Your Script *</Label>
          <Textarea
            placeholder="Paste or type your complete script here..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[250px] bg-black/40 text-white border-white/10 resize-y"
            rows={12}
          />
          <div className="flex justify-between text-xs text-white/50">
            <p>This script will be used exactly as you write it — no AI changes will be made.</p>
            <p>{wordCount} words</p>
          </div>
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
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
          ) : (
            "Save & continue"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
