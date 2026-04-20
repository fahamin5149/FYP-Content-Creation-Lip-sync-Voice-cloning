/**
 * Client-side checks so users don't pick audio in the video flow (and vice versa).
 * Extension fallbacks are only for clearly one-sided types when MIME is missing.
 */

const STRONG_AUDIO_EXT = new Set([".mp3", ".wav", ".flac", ".aac", ".m4a", ".opus", ".oga"])
/** Containers that are almost always video in this app */
const STRONG_VIDEO_EXT = new Set([".mov", ".avi", ".mkv", ".wmv", ".mpg", ".mpeg", ".m4v"])

function extOf(name: string): string {
  return (name.toLowerCase().match(/\.[^.]+$/)?.[0] || "") as string
}

/** Non-null => block upload in Video setup / video pickers */
export function getVideoUploadRejectionReason(file: { name: string; type?: string }): string | null {
  const mime = (file.type || "").toLowerCase()
  if (mime.startsWith("audio/")) {
    return "This is an audio file. Upload it under Setup → Voice, not Video."
  }
  if (mime.startsWith("video/")) return null
  const ext = extOf(file.name || "")
  if (STRONG_AUDIO_EXT.has(ext)) {
    return "This looks like an audio file. Use Setup → Voice for audio uploads."
  }
  return null
}

/** Non-null => block upload in Voice setup / audio pickers */
export function getAudioUploadRejectionReason(file: { name: string; type?: string }): string | null {
  const mime = (file.type || "").toLowerCase()
  if (mime.startsWith("video/")) {
    return "This is a video file. Upload it under Setup → Video, not Voice."
  }
  if (mime.startsWith("audio/")) return null
  const ext = extOf(file.name || "")
  if (STRONG_VIDEO_EXT.has(ext)) {
    return "This looks like a video file. Use Setup → Video for video uploads."
  }
  return null
}
