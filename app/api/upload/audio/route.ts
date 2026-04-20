import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { ensureAudioFileIsWav } from '@/lib/transcodeAudioToWav'
import { SUPPORTED_AUDIO_FORMATS_LABEL, isSupportedAudioFile } from '@/lib/audioFormats'
import { getAudioUploadRejectionReason } from '@/lib/mediaUploadGuards'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('audio') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const wrongKind = getAudioUploadRejectionReason({ name: file.name, type: file.type })
    if (wrongKind) {
      return NextResponse.json({ error: wrongKind }, { status: 400 })
    }

    // Validate file type using MIME and extension fallback (some browsers send empty/odd MIME)
    if (!isSupportedAudioFile({ name: file.name, type: file.type })) {
      return NextResponse.json({
        error: `Unsupported audio format. Supported formats: ${SUPPORTED_AUDIO_FORMATS_LABEL}.`,
      }, { status: 400 })
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB.' 
      }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'audio')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}_${file.name}`
    const filepath = join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    let outPath = filepath
    let outFilename = filename
    let outSize = buffer.length
    let outType = file.type

    try {
      const wav = await ensureAudioFileIsWav(filepath, filename, file.type, file.name)
      outPath = wav.path
      outFilename = wav.filename
      outSize = wav.sizeBytes
      outType = wav.mimeType
    } catch (convErr: unknown) {
      console.error('Audio to WAV conversion failed:', convErr)
      await unlink(outPath).catch(() => {})
      return NextResponse.json(
        {
          error:
            convErr instanceof Error
              ? convErr.message
              : 'Failed to convert audio to WAV. Install ffmpeg and use a supported format.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      filename: outFilename,
      filepath: outPath,
      size: outSize,
      type: outType,
      message: 'Audio file uploaded successfully',
    })

  } catch (error) {
    console.error('Error uploading audio file:', error)
    return NextResponse.json({ 
      error: 'Failed to upload audio file' 
    }, { status: 500 })
  }
}

