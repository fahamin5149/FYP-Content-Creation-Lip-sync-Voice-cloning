// app/api/process/urdu-tts/route.ts
//
// Orchestrates Urdu voice cloning (two-stage zero-shot):
//   1. Create a "pending" TTS job in Supabase (via Node.js backend)
//   2. Resolve selected media IDs → absolute disk paths (via Node.js backend)
//   3. Call Python FastAPI :8001 — Stage 1 Parler-TTS + Stage 2 OpenVoice V2
//   4. Update the job to "completed" or "failed" (via Node.js backend)
//
// Mirrors app/api/process/tts/route.ts (English xtts_v2) in structure.
// Key differences:
//   - Calls URDU_TTS_URL (:8001) instead of PYTHON_TTS_URL (:8000)
//   - Endpoint is /tts/urdu instead of /tts/clone
//   - Passes style_preset and user_id for Parler-TTS + adaptive profiles
//   - Output written to TTS_Output/urdu/{userId}/{scriptId}.wav
//   - Job tagged with language: 'urdu'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import path from 'path'
import http from 'http'
import https from 'https'
import fs from 'fs'

// Urdu synthesis is faster than xtts_v2 — 5 minutes is ample even on CPU
export const maxDuration = 300

const NODE_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const URDU_TTS_URL = process.env.URDU_TTS_URL || 'http://localhost:8001'
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || ''

// ── Helper: call Node.js backend with Clerk Bearer token ─────────────────────
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

// ── Helper: call Node.js backend with internal secret ────────────────────────
// Used after long synthesis when the Clerk JWT may have expired.
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

// ── POST /api/process/urdu-tts ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ─ Auth ──────────────────────────────────────────────────────────────────
    const authObj = await auth()
    if (!authObj.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─ Parse body ─────────────────────────────────────────────────────────────
    const { scriptId, text, mediaIds, stylePreset = 'neutral_male' } =
      await request.json()

    if (!scriptId || !text?.trim() || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'scriptId, text, and mediaIds (non-empty array) are required' },
        { status: 400 }
      )
    }

    const validPresets = ['neutral_male', 'neutral_female', 'slow_clear', 'expressive']
    const preset = validPresets.includes(stylePreset) ? stylePreset : 'neutral_male'

    // ─ Step 1: Create pending job in Supabase ─────────────────────────────────
    let token = await authObj.getToken()
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })

    const jobRes = await fetchBackend('/api/tts/jobs', token, {
      method: 'POST',
      body: JSON.stringify({
        scriptId,
        inputMediaIds: mediaIds,
        language: 'urdu',
      }),
    })
    const jobId: string = jobRes.data.id

    // ─ Step 2: Resolve media IDs → absolute disk paths ────────────────────────
    const pathsRes = await fetchBackend('/api/tts/resolve-paths', token, {
      method: 'POST',
      body: JSON.stringify({ mediaIds }),
    })
    const speakerPaths: string[] = pathsRes.data.map((d: any) => d.absolutePath)

    // ─ Step 3: Call Urdu Python TTS service ───────────────────────────────────
    // Output is deterministic: same user + script always produces the same path.
    // This means refreshing the page after synthesis will find the cached file.
    const outputDir = path.join(process.cwd(), 'TTS_Output', 'urdu', authObj.userId)
    fs.mkdirSync(outputDir, { recursive: true })
    const outputPath = path.join(outputDir, `${scriptId}.wav`)

    let synthesisResult: any
    try {
      // Use raw http.request to avoid undici's default socket timeout.
      // Urdu synthesis is typically 10–40 s on GPU; could be longer on CPU.
      synthesisResult = await new Promise<any>((resolve, reject) => {
        const payload = JSON.stringify({
          text,
          speaker_wav_paths: speakerPaths,
          output_path: outputPath,
          style_preset: preset,
          user_id: authObj.userId,
        })

        const ttsUrl = new URL(`${URDU_TTS_URL}/tts/urdu`)
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
            timeout: 0, // no socket timeout — synthesis can take several minutes on CPU
          },
          (res) => {
            let data = ''
            res.on('data', (chunk) => { data += chunk })
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data)
                if (res.statusCode && res.statusCode >= 400) {
                  reject(new Error(parsed.detail || `Urdu TTS error: ${res.statusCode}`))
                } else {
                  resolve(parsed)
                }
              } catch {
                reject(new Error(`Invalid JSON from Urdu TTS service: ${data.slice(0, 200)}`))
              }
            })
          }
        )
        req.on('error', reject)
        req.write(payload)
        req.end()
      })

    } catch (ttsError: any) {
      // Mark job failed — use internal secret in case JWT expired during synthesis
      try {
        await fetchBackendInternal(`/api/tts/jobs/${jobId}`, authObj.userId, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'failed',
            error: ttsError.message || 'Urdu synthesis failed',
          }),
        })
      } catch { /* best-effort */ }

      return NextResponse.json(
        { error: `Urdu voice synthesis failed: ${ttsError.message}` },
        { status: 502 }
      )
    }

    // ─ Step 4: Update job to completed ────────────────────────────────────────
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
      // Synthesis succeeded and file is on disk — log but don't fail the response
      console.error('Failed to update Urdu TTS job status:', updateError)
    }

    // ─ Response ───────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      jobId,
      durationSeconds: synthesisResult.duration_seconds,
      message: 'Urdu voice cloning completed successfully',
    })

  } catch (error: any) {
    console.error('Urdu TTS route error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
