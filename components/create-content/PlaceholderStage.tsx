"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PlaceholderStageProps {
  title: string
  icon: string
  description: string
  onBack: () => void
  onNext?: () => void
}

export default function PlaceholderStage({ title, icon, description, onBack, onNext }: PlaceholderStageProps) {
  return (
    <Card className="border-white/10 bg-white/5 text-white text-center">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center justify-center gap-3">
          <span className="text-3xl">{icon}</span>
          {title}
        </CardTitle>
        <CardDescription className="text-white/70">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-dashed border-white/15 bg-black/30 px-6 py-10 text-white/70">
          Coming soon
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={onBack}>
            Back
          </Button>
          {onNext && (
            <Button className="bg-gradient-to-r from-primary to-primary/80 text-white" onClick={onNext}>
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
