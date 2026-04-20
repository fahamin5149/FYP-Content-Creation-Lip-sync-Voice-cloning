export const INTERNAL_VIDEO_FORMAT_LABEL = "MP4 (H.264 + AAC)"

export const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".avi", ".mkv"] as const
export const SUPPORTED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/avi",
  "video/x-matroska",
] as const

export const SUPPORTED_VIDEO_FORMATS_LABEL = "MP4, MOV, WEBM, AVI, MKV"
export const VIDEO_FILE_INPUT_ACCEPT = SUPPORTED_VIDEO_EXTENSIONS.join(",")

export function isSupportedVideoFile(file: { name?: string; type?: string }): boolean {
  const mime = (file.type || "").toLowerCase()
  const ext = ((file.name || "").toLowerCase().match(/\.[^.]+$/)?.[0] || "")
  return (
    SUPPORTED_VIDEO_MIME_TYPES.includes(mime as (typeof SUPPORTED_VIDEO_MIME_TYPES)[number]) ||
    SUPPORTED_VIDEO_EXTENSIONS.includes(ext as (typeof SUPPORTED_VIDEO_EXTENSIONS)[number])
  )
}

