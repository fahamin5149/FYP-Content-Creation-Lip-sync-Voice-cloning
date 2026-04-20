import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'

const execFileAsync = promisify(execFile)

export function isAlreadyWav(mimetype: string, filename: string): boolean {
  const m = mimetype.toLowerCase()
  if (m === 'audio/wav' || m === 'audio/wave' || m === 'audio/x-wav') return true
  return path.extname(filename).toLowerCase() === '.wav'
}

async function transcodeToWav(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync(
    'ffmpeg',
    ['-y', '-i', inputPath, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', outputPath],
    { maxBuffer: 16 * 1024 * 1024 }
  )
}

export interface WavFileInfo {
  path: string
  filename: string
  mimeType: string
  sizeBytes: number
  displayFilename: string
}

/**
 * If the file is not WAV, transcode with ffmpeg to PCM WAV (44.1kHz stereo) beside the input
 * and delete the original. Requires ffmpeg on PATH.
 */
export async function ensureAudioFileIsWav(
  inputPath: string,
  diskFilename: string,
  mimeType: string,
  originalFilename: string
): Promise<WavFileInfo> {
  if (isAlreadyWav(mimeType, originalFilename)) {
    const st = await fs.stat(inputPath)
    return {
      path: inputPath,
      filename: diskFilename,
      mimeType: 'audio/wav',
      sizeBytes: st.size,
      displayFilename: originalFilename.endsWith('.wav')
        ? originalFilename
        : `${path.parse(originalFilename).name}.wav`,
    }
  }

  const dir = path.dirname(inputPath)
  const baseNoExt = path.parse(diskFilename).name
  const outFilename = `${baseNoExt}.wav`
  const outPath = path.join(dir, outFilename)

  try {
    await transcodeToWav(inputPath, outPath)
  } catch (err: unknown) {
    await fs.unlink(outPath).catch(() => {})
    const e = err as NodeJS.ErrnoException
    if (e?.code === 'ENOENT') {
      throw new Error('ffmpeg not found on PATH (required to convert audio to WAV)')
    }
    throw err
  }

  await fs.unlink(inputPath)
  const st = await fs.stat(outPath)
  const baseDisplay = path.parse(originalFilename).name

  return {
    path: outPath,
    filename: outFilename,
    mimeType: 'audio/wav',
    sizeBytes: st.size,
    displayFilename: `${baseDisplay}.wav`,
  }
}
