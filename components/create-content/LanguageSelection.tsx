"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LanguageSelectionProps {
  onSelect: (language: string) => void
}

export default function LanguageSelection({ onSelect }: LanguageSelectionProps) {
  const languages = [
    { label: "English", description: "Ideal for global audiences" },
    { label: "Urdu", description: "Optimized for RTL and local tone" },
  ]

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Choose your language</CardTitle>
        <CardDescription className="text-white/70">
          Tailor the pipeline to the language you want to create in.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {languages.map((lang) => (
          <div
            key={lang.label}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 shadow-md"
          >
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-primary/5 to-transparent" />
            <div className="relative flex flex-col gap-2">
              <div className="text-lg font-semibold">{lang.label}</div>
              <p className="text-sm text-white/70">{lang.description}</p>
              <Button
                variant="secondary"
                className="mt-2 w-fit bg-primary/80 text-white hover:bg-primary"
                onClick={() => onSelect(lang.label)}
              >
                Continue
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
