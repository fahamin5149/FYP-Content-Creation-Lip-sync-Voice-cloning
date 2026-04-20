export const SUPPORTED_AUDIO_EXTENSIONS = [".mp3", ".m4a", ".ogg", ".flac", ".wav", ".webm", ".aac", ".mp4"] as const

export const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "audio/aac",
  "audio/webm",
] as const

export const SUPPORTED_AUDIO_FORMATS_LABEL = "MP3, M4A, OGG, FLAC, WAV, WEBM, AAC, MP4"

export const AUDIO_FILE_INPUT_ACCEPT = SUPPORTED_AUDIO_EXTENSIONS.join(",")

export function isSupportedAudioFile(file: { name?: string; type?: string }): boolean {
  const mime = (file.type || "").toLowerCase()
  const ext = ((file.name || "").toLowerCase().match(/\.[^.]+$/)?.[0] || "")
  return (
    SUPPORTED_AUDIO_MIME_TYPES.includes(mime as (typeof SUPPORTED_AUDIO_MIME_TYPES)[number]) ||
    SUPPORTED_AUDIO_EXTENSIONS.includes(ext as (typeof SUPPORTED_AUDIO_EXTENSIONS)[number])
  )
}

