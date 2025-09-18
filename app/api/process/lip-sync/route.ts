import { NextRequest, NextResponse } from 'next/server'
import { lipSyncService } from '@/lib/ai-services'

export async function POST(request: NextRequest) {
  try {
    const { 
      videoPath, 
      audioPath, 
      userId, 
      syncSettings = {},
      jobId 
    } = await request.json()

    if (!videoPath || !audioPath || !userId) {
      return NextResponse.json({ 
        error: 'Video path, audio path, and user ID are required' 
      }, { status: 400 })
    }

    // Analyze video first
    const videoAnalysis = await lipSyncService.analyzeVideo(videoPath)
    
    if (!videoAnalysis.faceDetected) {
      return NextResponse.json({ 
        error: 'No face detected in video. Please ensure a clear face is visible.',
        analysis: videoAnalysis
      }, { status: 400 })
    }

    // Use real lip sync service
    const result = await lipSyncService.syncLipMovement(
      videoPath, 
      audioPath, 
      userId, 
      syncSettings
    )

    return NextResponse.json({
      success: true,
      jobId: jobId || `lipsync_${Date.now()}`,
      status: 'completed',
      result: {
        videoPath: result.videoPath,
        duration: result.duration,
        quality: result.quality,
        syncAccuracy: result.syncAccuracy,
        processingTime: result.processingTime,
        videoAnalysis: videoAnalysis
      },
      message: 'Lip synchronization completed successfully'
    })

  } catch (error) {
    console.error('Error processing lip synchronization:', error)
    return NextResponse.json({ 
      error: 'Failed to process lip synchronization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { videoPath } = await request.json()

    if (!videoPath) {
      return NextResponse.json({ 
        error: 'Video path is required' 
      }, { status: 400 })
    }

    // Use real video analysis service
    const analysis = await lipSyncService.analyzeVideo(videoPath)

    return NextResponse.json({
      success: true,
      analysis: analysis,
      message: 'Video analysis completed'
    })

  } catch (error) {
    console.error('Error analyzing video:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Real implementation would use Wav2Lip or similar:
/*
import cv2
import torch
from wav2lip import Wav2Lip

const wav2lip = new Wav2Lip()

export async function syncLipWithWav2Lip(videoPath: string, audioPath: string) {
  const result = await wav2lip.inference({
    checkpoint_path: './models/wav2lip_gan.pth',
    face: videoPath,
    audio: audioPath,
    outfile: `./output/lipsync_${Date.now()}.mp4`,
    static: false,
    fps: 25,
    pads: [0, 10, 0, 0],
    face_det_batch_size: 16,
    wav2lip_batch_size: 128,
    resize_factor: 1,
    crop: [0, -1, 0, -1],
    box: [-1, -1, -1, -1],
    rotate: false,
    nosmooth: false
  })
  
  return result
}

// SadTalker Integration (Alternative)
import { SadTalker } from 'sadtalker'

const sadtalker = new SadTalker()

export async function syncLipWithSadTalker(videoPath: string, audioPath: string) {
  const result = await sadtalker.inference({
    driven_audio: audioPath,
    source_image: videoPath,
    preprocess: 'full',
    still: false,
    use_enhancer: false,
    pose_style: 0,
    batch_size: 2,
    size: 256,
    expression_scale: 1.0,
    input_yaw: null,
    input_pitch: null,
    input_roll: null,
    ref_eyeblink: null,
    ref_pose: null,
    checkpoint_dir: './checkpoints',
    result_dir: './results'
  })
  
  return result
}
*/
