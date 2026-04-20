import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"
import {
  INTERNAL_VIDEO_AUDIO_CODEC,
  INTERNAL_VIDEO_MIME_TYPE,
  INTERNAL_VIDEO_VIDEO_CODEC,
} from "../constants/videoFormats.js"

const execFileAsync = promisify(execFile)

export interface StandardVideoInfo {
  path: string
  filename: string
  mimeType: string
  sizeBytes: number
  displayFilename: string
}

function isAlreadyStandardVideo(mimeType: string, originalFilename: string): boolean {
  const mime = (mimeType || "").toLowerCase()
  const ext = path.extname(originalFilename || "").toLowerCase()
  return mime === INTERNAL_VIDEO_MIME_TYPE && ext === ".mp4"
}

async function transcodeVideoToMp4(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      INTERNAL_VIDEO_VIDEO_CODEC === "h264" ? "libx264" : INTERNAL_VIDEO_VIDEO_CODEC,
      "-preset",
      "medium",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      INTERNAL_VIDEO_AUDIO_CODEC,
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { maxBuffer: 16 * 1024 * 1024 }
  )
}

/**
 * Normalize uploaded videos to internal MP4/H.264(+AAC). If already mp4, keep as-is.
 * Throws descriptive errors when conversion is not possible.
 */
export async function ensureVideoIsInternalStandard(
  inputPath: string,
  diskFilename: string,
  mimeType: string,
  originalFilename: string
): Promise<StandardVideoInfo> {
  if (isAlreadyStandardVideo(mimeType, originalFilename)) {
    const st = await fs.stat(inputPath)
    return {
      path: inputPath,
      filename: diskFilename,
      mimeType: INTERNAL_VIDEO_MIME_TYPE,
      sizeBytes: st.size,
      displayFilename: originalFilename,
    }
  }

  const dir = path.dirname(inputPath)
  const baseNoExt = path.parse(diskFilename).name
  const outputFilename = `${baseNoExt}.mp4`
  const outputPath = path.join(dir, outputFilename)

  try {
    await transcodeVideoToMp4(inputPath, outputPath)
  } catch (err: unknown) {
    await fs.unlink(outputPath).catch(() => {})
    const e = err as NodeJS.ErrnoException
    if (e?.code === "ENOENT") {
      throw new Error("ffmpeg not found on PATH (required to convert videos to MP4/H.264).")
    }
    throw new Error(
      "Video could not be converted to internal MP4/H.264 format. The file may be corrupted or use unsupported codecs."
    )
  }

  await fs.unlink(inputPath).catch(() => {})
  const st = await fs.stat(outputPath)
  const displayBase = path.parse(originalFilename).name

  return {
    path: outputPath,
    filename: outputFilename,
    mimeType: INTERNAL_VIDEO_MIME_TYPE,
    sizeBytes: st.size,
    displayFilename: `${displayBase}.mp4`,
  }
}

