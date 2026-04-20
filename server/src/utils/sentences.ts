/**
 * Keep only the first `n` sentences. Splits on common terminators (. ! ? … Urdu ۔).
 * Used to enforce a max sentence count (e.g. exactly 1) when the model drifts.
 */
export function takeFirstNSentences(text: string, n: number): string {
  const t = text.trim()
  if (!t || n <= 0) return t

  const parts = t
    .split(/(?<=[.!?…\u06D4])\s+/u)
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length <= n) return t
  return parts.slice(0, n).join(" ").trim()
}
