export type Stage =
  | "language"
  | "method"
  | "refinement"
  | "generation"
  | "review"
  | "tts"
  | "video"

export interface ContentState {
  language: string
  method: "refinement" | "generation" | null
  scriptId: string | null
  generatedScript: string | null
  parameters: any
}
