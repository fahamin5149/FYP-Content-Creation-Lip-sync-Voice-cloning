export type Stage =
  | "language"
  | "method"
  | "refinement"
  | "generation"
  | "passthrough"
  | "review"
  | "tts"
  | "video"

export interface ContentState {
  language: string
  method: "refinement" | "generation" | "passthrough" | null
  scriptId: string | null
  generatedScript: string | null
  parameters: any
  ttsJobId: string | null
}
