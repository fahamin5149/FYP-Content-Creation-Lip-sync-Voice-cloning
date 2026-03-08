// app/api/process/tts/route.ts
//
// Orchestrates English voice cloning:
//   1. Create a "pending" TTS job in Supabase (via Node.js backend)
//   2. Resolve selected media IDs → absolute disk paths (via Node.js backend)
//   3. Call FastAPI Python service for xtts_v2 synthesis
//   4. Update the job to "completed" or "failed" (via Node.js backend)
//
// Designed for local development. Vercel Hobby's 10 s function limit is
// incompatible — a job-queue architecture would be needed for production.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import path from 'path'
import http from 'http'
import https from 'https'
import fs from 'fs'

// Allow up to 1200 s (20 min) for xtts_v2 synthesis
// Note: Synthesis times vary; 30-90s is typical on GPU, 10-20+ min on CPU
export const maxDuration = 1200

const NODE_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const PYTHON_TTS_URL = process.env.PYTHON_TTS_URL || 'http://localhost:8000'
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || ''

// ── Helper: fetch Node.js backend with Clerk Bearer token ───────────────────
async function fetchBackend(
  endpoint: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || `Backend ${endpoint} failed: ${res.status}`)
  return body
}

// ── Helper: fetch Node.js backend with internal secret (bypasses JWT expiry) ─
async function fetchBackendInternal(
  endpoint: string,
  userId: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_API_SECRET,
      'x-internal-user-id': userId,
      ...(options.headers || {}),
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || `Backend ${endpoint} failed: ${res.status}`)
  return body
}

// ── POST /api/process/tts ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ─ Auth ─────────────────────────────────────────────────────────────────
    const authObj = await auth()
    if (!authObj.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─ Parse body ───────────────────────────────────────────────────────────
    const { scriptId, text, language = 'en', mediaIds } = await request.json()

    if (!scriptId || !text?.trim() || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'scriptId, text, and mediaIds (non-empty array) are required' },
        { status: 400 }
      )
    }

    // ─ Step 1: Create pending job in Supabase ───────────────────────────────
    // We create the job first so even if synthesis fails or the token
    // expires during the long synthesis call, the record still exists.
    let token = await authObj.getToken()
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })

    const jobRes = await fetchBackend('/api/tts/jobs', token, {
      method: 'POST',
      body: JSON.stringify({ scriptId, inputMediaIds: mediaIds }),
    })
    const jobId: string = jobRes.data.id

    // ─ Step 2: Resolve media IDs → absolute disk paths ──────────────────────
    const pathsRes = await fetchBackend('/api/tts/resolve-paths', token, {
      method: 'POST',
      body: JSON.stringify({ mediaIds }),
    })
    const speakerPaths: string[] = pathsRes.data.map((d: any) => d.absolutePath)

    // ─ Step 3: Call FastAPI Python TTS service ──────────────────────────────
    // Output path is deterministic: TTS_Output/results/{userId}/{scriptId}.wav
    // Refreshing the page after synthesis will find the same file on disk.
    const outputDir = path.join(process.cwd(), 'TTS_Output', 'results', authObj.userId)
    fs.mkdirSync(outputDir, { recursive: true })
    const outputPath = path.join(outputDir, `${scriptId}.wav`)

    let synthesisResult: any
    try {
      // Use raw http.request instead of fetch to avoid undici's 5-minute
      // default socket timeout which kills long-running CPU synthesis calls.
      synthesisResult = await new Promise<any>((resolve, reject) => {
        const payload = JSON.stringify({
          text,
          speaker_wav_paths: speakerPaths,
          language,
          output_path: outputPath,
        })
        const ttsUrl = new URL(`${PYTHON_TTS_URL}/tts/clone`)
        const lib = ttsUrl.protocol === 'https:' ? https : http
        const req = lib.request(
          {
            hostname: ttsUrl.hostname,
            port: ttsUrl.port,
            path: ttsUrl.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
            timeout: 0, // no socket timeout
          },
          (res) => {
            let data = ''
            res.on('data', (chunk) => { data += chunk })
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data)
                if (res.statusCode && res.statusCode >= 400) {
                  reject(new Error(parsed.detail || `TTS service error: ${res.statusCode}`))
                } else {
                  resolve(parsed)
                }
              } catch {
                reject(new Error(`Invalid JSON from TTS service: ${data.slice(0, 200)}`))
              }
            })
          }
        )
        req.on('error', reject)
        req.write(payload)
        req.end()
      })

    } catch (ttsError: any) {
      // Mark job as failed using internal secret (JWT may already be expired)
      try {
        await fetchBackendInternal(`/api/tts/jobs/${jobId}`, authObj.userId, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'failed',
            error: ttsError.message || 'Synthesis failed',
          }),
        })
      } catch { /* best-effort update */ }

      return NextResponse.json(
        { error: `Voice synthesis failed: ${ttsError.message}` },
        { status: 502 }
      )
    }

    // ─ Step 4: Update job to completed ──────────────────────────────────────
    // Use internal secret instead of Clerk JWT — synthesis may take 10+ minutes
    // and the JWT will have expired long before we get here.
    try {
      await fetchBackendInternal(`/api/tts/jobs/${jobId}`, authObj.userId, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          outputAudioPath: synthesisResult.output_path,
          durationSeconds: synthesisResult.duration_seconds,
        }),
      })
    } catch (updateError) {
      // Synthesis succeeded and file exists — log but don't fail the response
      console.error('Failed to update TTS job status:', updateError)
    }

    // ─ Response ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      jobId,
      durationSeconds: synthesisResult.duration_seconds,
      message: 'Voice cloning completed successfully',
    })

  } catch (error: any) {
    console.error('TTS route error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
