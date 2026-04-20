"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function normalizeLang(s: string) {
  return s.trim().toLowerCase()
}

interface LanguageSelectionProps {
  selectedLanguage?: string
  onSelect: (language: string) => void
}

export default function LanguageSelection({ selectedLanguage, onSelect }: LanguageSelectionProps) {
  const languages = [
    { label: "English", description: "Ideal for global audiences" },
    { label: "Urdu", description: "Optimized for RTL and local tone" },
  ]

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Choose your language</CardTitle>
        <CardDescription className="text-white/70">
          Tailor the pipeline to the language you want to create in. You can switch later from the progress bar — your
          choice is remembered.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {languages.map((lang) => {
          const isSelected =
            selectedLanguage && normalizeLang(selectedLanguage) === normalizeLang(lang.label)
          return (
            <div
              key={lang.label}
              className={cn(
                "relative overflow-hidden rounded-xl border p-4 shadow-md transition",
                isSelected
                  ? "border-primary bg-primary/15 ring-2 ring-primary/40"
                  : "border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent"
              )}
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
                  {isSelected ? "Continue" : "Select"}
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
