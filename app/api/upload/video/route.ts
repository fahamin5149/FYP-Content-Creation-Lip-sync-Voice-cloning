import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import {
  INTERNAL_VIDEO_FORMAT_LABEL,
  SUPPORTED_VIDEO_FORMATS_LABEL,
  isSupportedVideoFile,
} from '@/lib/videoFormats'
import { ensureVideoIsInternalStandard } from '@/lib/transcodeVideoToStandard'
import { getVideoUploadRejectionReason } from '@/lib/mediaUploadGuards'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('video') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    const wrongKind = getVideoUploadRejectionReason({ name: file.name, type: file.type })
    if (wrongKind) {
      return NextResponse.json({ error: wrongKind }, { status: 400 })
    }

    // Validate file type using MIME and extension fallback
    if (!isSupportedVideoFile({ name: file.name, type: file.type })) {
      return NextResponse.json({
        error: `Unsupported video format. Supported formats: ${SUPPORTED_VIDEO_FORMATS_LABEL}.`,
      }, { status: 400 })
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 100MB.' 
      }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'video')
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
    let outType = file.type || 'video/mp4'

    try {
      const normalized = await ensureVideoIsInternalStandard(filepath, filename, file.type, file.name)
      outPath = normalized.path
      outFilename = normalized.filename
      outSize = normalized.sizeBytes
      outType = normalized.mimeType
    } catch (convErr: unknown) {
      console.error('Video normalization failed:', convErr)
      await unlink(outPath).catch(() => {})
      return NextResponse.json(
        {
          error:
            convErr instanceof Error
              ? convErr.message
              : `Video cannot be converted to ${INTERNAL_VIDEO_FORMAT_LABEL}.`,
        },
        { status: 422 }
      )
    }

    // Return file info
    return NextResponse.json({
      success: true,
      filename: outFilename,
      filepath: outPath,
      size: outSize,
      type: outType,
      message: `Video uploaded and standardized to ${INTERNAL_VIDEO_FORMAT_LABEL} successfully`,
    })

  } catch (error) {
    console.error('Error uploading video file:', error)
    return NextResponse.json({ 
      error: 'Failed to upload video file' 
    }, { status: 500 })
  }
}

