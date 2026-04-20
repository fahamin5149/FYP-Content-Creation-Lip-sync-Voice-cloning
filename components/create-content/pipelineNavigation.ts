import type { ContentState, Stage } from "./types"

/** Visual step indices (matches ProgressIndicator order). */
export const PIPELINE_STEP_COUNT = 6

export function getActiveStepIndex(stage: Stage): number {
  if (stage === "refinement" || stage === "generation" || stage === "passthrough") return 2
  if (stage === "language") return 0
  if (stage === "method") return 1
  if (stage === "review") return 3
  if (stage === "tts") return 4
  if (stage === "video") return 5
  return 0
}

/** Highest step index the user may open given saved pipeline state. */
export function maxReachableStepIndex(state: ContentState): number {
  if (!state.language?.trim()) return 0
  if (!state.method) return 1
  if (!state.scriptId || !state.generatedScript) return 2
  return 5
}

/**
 * Map a visual step index to the concrete stage. Returns null if prerequisites are missing.
 */
export function stepIndexToStage(index: number, state: ContentState): Stage | null {
  if (index === 0) return "language"
  if (index === 1) {
    if (!state.language?.trim()) return null
    return "method"
  }
  if (index === 2) {
    if (!state.language?.trim() || !state.method) return null
    if (state.method === "passthrough") return "passthrough"
    if (state.method === "refinement") return "refinement"
    return "generation"
  }
  if (index === 3 || index === 4 || index === 5) {
    if (!state.scriptId || !state.generatedScript) return null
    if (index === 3) return "review"
    if (index === 4) return "tts"
    return "video"
  }
  return null
}

/** Previous pipeline step, or null if already at the first step. */
export function getPreviousStage(current: Stage, state: ContentState): Stage | null {
  const idx = getActiveStepIndex(current)
  if (idx <= 0) return null
  return stepIndexToStage(idx - 1, state)
}
