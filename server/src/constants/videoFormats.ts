/**
 * Unified internal video standard used across upload + processing pipeline.
 * All accepted uploads are normalized to this format before persistence.
 */
export const INTERNAL_VIDEO_CONTAINER = "mp4" as const
export const INTERNAL_VIDEO_VIDEO_CODEC = "h264" as const
export const INTERNAL_VIDEO_AUDIO_CODEC = "aac" as const
export const INTERNAL_VIDEO_MIME_TYPE = "video/mp4" as const

export const SUPPORTED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/avi",
  "video/x-matroska",
] as const

export const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".avi", ".mkv"] as const

export const SUPPORTED_VIDEO_FORMATS_LABEL = "MP4, MOV, WEBM, AVI, MKV"

