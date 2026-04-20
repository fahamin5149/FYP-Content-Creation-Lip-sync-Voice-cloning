import type { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// ── Lip-sync output paths ─────────────────────────────────────────────────
// Written by Next.js → Wav2Lip: LIPSYNC_Output/{userId}/{jobId}.mp4

function lipSyncUserDirs(userId: string): string[] {
  const candidates = [
    path.join(process.cwd(), 'LIPSYNC_Output', userId),
    path.join(process.cwd(), '..', 'LIPSYNC_Output', userId),
  ]
  return candidates.filter((d) => {
    try {
      return fs.existsSync(d) && fs.statSync(d).isDirectory()
    } catch {
      return false
    }
  })
}

function resolveLipSyncOutputFile(userId: string, jobId: string): string | null {
  for (const dir of lipSyncUserDirs(userId)) {
    const filePath = path.join(dir, `${jobId}.mp4`)
    if (fs.existsSync(filePath)) return filePath
  }
  return null
}

export const listLipSyncOutputs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const dirs = lipSyncUserDirs(userId)
    if (dirs.length === 0) {
      res.json({ success: true, data: [] })
      return
    }

    const byJob = new Map<string, { jobId: string; size_bytes: number; created_at: string }>()

    for (const dir of dirs) {
      let names: string[]
      try {
        names = fs.readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.mp4'))
          .map((e) => e.name)
      } catch (err) {
        console.error('listLipSyncOutputs readdir:', dir, err)
        res.status(500).json({
          error: 'Failed to read lip-sync output directory',
          detail: err instanceof Error ? err.message : String(err),
        })
        return
      }

      for (const name of names) {
        const jobId = name.replace(/\.mp4$/i, '')
        const full = path.join(dir, name)
        let st: fs.Stats
        try {
          st = fs.statSync(full)
        } catch {
          continue
        }
        const row = {
          jobId,
          size_bytes: st.size,
          created_at: st.mtime.toISOString(),
        }
        const prev = byJob.get(jobId)
        if (!prev || new Date(row.created_at) > new Date(prev.created_at)) {
          byJob.set(jobId, row)
        }
      }
    }

    const data = Array.from(byJob.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    res.json({ success: true, data })
  } catch (err) {
    console.error('listLipSyncOutputs:', err)
    res.status(500).json({
      error: 'Failed to list lip-sync outputs',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}

// ── Stream generated lip-sync output ────────────────────────────────────
export const streamLipSyncOutput = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth!.userId
  const jobId = String(req.params.jobId)

  const outputPath = resolveLipSyncOutputFile(userId, jobId)
  if (!outputPath) {
    res.status(404).json({ error: 'Lip-sync output not found on disk' })
    return
  }

  res.setHeader('Content-Type', 'video/mp4')
  res.setHeader('Accept-Ranges', 'bytes')
  fs.createReadStream(outputPath).pipe(res)
}

type ExportFormat = 'mp4' | 'mov' | 'webm'

function parseExportFormat(value: string | undefined): ExportFormat | null {
  const v = (value || '').toLowerCase()
  if (v === 'mp4' || v === 'mov' || v === 'webm') return v
  return null
}

async function convertLipSyncOutput(srcPath: string, outPath: string, format: ExportFormat): Promise<void> {
  const argsByFormat: Record<ExportFormat, string[]> = {
    mp4: ['-y', '-i', srcPath, '-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart', outPath],
    mov: ['-y', '-i', srcPath, '-c:v', 'libx264', '-c:a', 'aac', outPath],
    webm: ['-y', '-i', srcPath, '-c:v', 'libvpx-vp9', '-c:a', 'libopus', outPath],
  }
  await execFileAsync('ffmpeg', argsByFormat[format], { maxBuffer: 16 * 1024 * 1024 })
}

export const streamLipSyncOutputExport = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth!.userId
  const jobId = String(req.params.jobId)
  const format = parseExportFormat(String(req.query.format || 'mp4'))

  if (!format) {
    res.status(400).json({ error: 'Invalid export format. Supported: mp4, mov, webm.' })
    return
  }

  const outputPath = resolveLipSyncOutputFile(userId, jobId)
  if (!outputPath) {
    res.status(404).json({ error: 'Lip-sync output not found on disk' })
    return
  }

  // Native path for internal format
  if (format === 'mp4') {
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', `attachment; filename="${jobId}.mp4"`)
    fs.createReadStream(outputPath).pipe(res)
    return
  }

  const tempOutput = path.join(os.tmpdir(), `lipsync_${jobId}_${Date.now()}.${format}`)
  try {
    await convertLipSyncOutput(outputPath, tempOutput, format)
  } catch (err) {
    await fs.promises.unlink(tempOutput).catch(() => {})
    res.status(422).json({
      error: `Failed to convert output to ${format.toUpperCase()}.`,
      detail:
        err instanceof Error
          ? err.message
          : 'The generated video could not be transcoded to the selected export format.',
    })
    return
  }

  const mimeByFormat: Record<ExportFormat, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
  }

  res.setHeader('Content-Type', mimeByFormat[format])
  res.setHeader('Content-Disposition', `attachment; filename="${jobId}.${format}"`)
  const stream = fs.createReadStream(tempOutput)
  stream.on('close', () => {
    fs.promises.unlink(tempOutput).catch(() => {})
  })
  stream.on('error', () => {
    fs.promises.unlink(tempOutput).catch(() => {})
  })
  stream.pipe(res)
}

/**
 * DELETE /api/lipsync/output/:jobId — remove generated MP4 from disk (owner only).
 */
export const deleteLipSyncOutput = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth?.userId
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const jobId = String(req.params.jobId || '').trim()
  if (!jobId || jobId.length > 500 || !/^[a-zA-Z0-9_.-]+$/.test(jobId)) {
    res.status(400).json({ error: 'Invalid job id' })
    return
  }

  const outputPath = resolveLipSyncOutputFile(userId, jobId)
  if (!outputPath) {
    res.status(404).json({ error: 'Lip-sync output not found' })
    return
  }

  try {
    await fs.promises.unlink(outputPath)
    res.json({ success: true })
  } catch (err) {
    console.error('deleteLipSyncOutput:', err)
    res.status(500).json({ error: 'Failed to delete lip-sync output' })
  }
}

