export type Stage =
  | "language"
  | "method"
  | "refinement"
  | "generation"
  | "passthrough"
  | "review"
  | "tts"
  | "video"

/** In-progress script forms — kept when navigating the pipeline via the stepper. */
export interface ScriptGenerationFormDraft {
  title: string
  topic: string
  scriptType: string
  tone: string
  targetAudience: string
  keyPoints: string
  duration: number
  pacing: string
  introStyle: string
  includeHook: boolean
  includeCTA: boolean
  includeTransitions: boolean
  includeQuestions: boolean
  generateOneSentence: boolean
  specialRequirements: string
}

export const DEFAULT_SCRIPT_GENERATION_FORM_DRAFT: ScriptGenerationFormDraft = {
  title: "",
  topic: "",
  scriptType: "",
  tone: "",
  targetAudience: "",
  keyPoints: "",
  duration: 60,
  pacing: "Medium",
  introStyle: "",
  includeHook: false,
  includeCTA: false,
  includeTransitions: false,
  includeQuestions: false,
  generateOneSentence: false,
  specialRequirements: "",
}

export interface ScriptRefinementFormDraft {
  title: string
  originalScript: string
  refinementType: "simple" | "custom"
  customInstructions: string
  duration: number
  pacing: string
}

export const DEFAULT_SCRIPT_REFINEMENT_FORM_DRAFT: ScriptRefinementFormDraft = {
  title: "",
  originalScript: "",
  refinementType: "simple",
  customInstructions: "",
  duration: 60,
  pacing: "Medium",
}

export interface ScriptPassthroughFormDraft {
  title: string
  script: string
}

export const DEFAULT_SCRIPT_PASSTHROUGH_FORM_DRAFT: ScriptPassthroughFormDraft = {
  title: "",
  script: "",
}

export interface ScriptFormDrafts {
  generation?: ScriptGenerationFormDraft
  refinement?: ScriptRefinementFormDraft
  passthrough?: ScriptPassthroughFormDraft
}

export interface ContentState {
  language: string
  method: "refinement" | "generation" | "passthrough" | null
  scriptId: string | null
  generatedScript: string | null
  parameters: any
  ttsJobId: string | null
  /** Partially filled script steps (survives stepper navigation). */
  scriptFormDrafts?: ScriptFormDrafts
}
