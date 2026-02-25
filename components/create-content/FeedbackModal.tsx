"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface FeedbackModalProps {
  trigger: React.ReactNode
  onSubmit: (feedback: string) => Promise<void> | void
}

export default function FeedbackModal({ trigger, onSubmit }: FeedbackModalProps) {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.trim()) return
    setSubmitting(true)
    await onSubmit(feedback)
    setSubmitting(false)
    setFeedback("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-black text-white border-white/10">
        <DialogHeader>
          <DialogTitle>Refine with feedback</DialogTitle>
          <DialogDescription className="text-white/70">
            Tell us what to adjust and we’ll rewrite instantly.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="e.g., Make the intro shorter and friendlier."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[140px] bg-black/40 text-white border-white/10"
        />
        <DialogFooter>
          <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!feedback.trim() || submitting}
            className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-primary/30"
          >
            {submitting ? "Refining..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
