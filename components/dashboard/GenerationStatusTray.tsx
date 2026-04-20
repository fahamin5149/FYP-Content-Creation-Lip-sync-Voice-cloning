"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { GenerationTask, hydrateGenerationTasks, subscribeGenerationTasks } from "@/lib/generationQueue"

export function GenerationStatusTray() {
  const [tasks, setTasks] = useState<GenerationTask[]>([])

  useEffect(() => {
    hydrateGenerationTasks()
    return subscribeGenerationTasks(setTasks)
  }, [])

  if (!tasks.length) return null

  const active = tasks.filter((t) => t.status === "running" || t.status === "timed_out").slice(0, 2)
  const completed = tasks.find((t) => t.status === "completed")
  const failed = tasks.find((t) => t.status === "failed")

  return (
    <div className="mb-4 space-y-2">
      {active.map((task) => (
        <div key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-white/70">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Generating... {task.progress}% complete
            </span>
            <span>{task.title}</span>
          </div>
          <Progress value={task.progress} />
        </div>
      ))}

      {!active.length && completed && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-emerald-200 inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Generation complete - view result
            </p>
            <Button asChild size="sm" variant="outline" className="border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/20">
              <Link href="/dashboard/create-content">Open</Link>
            </Button>
          </div>
        </div>
      )}

      {!active.length && failed && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs text-red-200 inline-flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Generation failed - Retry
          </p>
          {failed.error && (
            <p className="mt-1 text-xs text-red-100/80 inline-flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {failed.error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

