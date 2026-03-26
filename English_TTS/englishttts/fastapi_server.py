"""
English TTS FastAPI Service — Voice Cloning via Coqui XTTS v2

Loads the xtts_v2 model once at startup and exposes:
  GET  /health      — readiness check
  POST /tts/clone   — voice-cloning synthesis

All speaker_wav_paths and output_path values are expected to be
absolute local disk paths (the caller is the Next.js API route
running on the same machine).
"""

import os
import uuid
import time
import tempfile
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional

import torch
import librosa
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tts-service")

# ── Paths ────────────────────────────────────────────────────────────────────
# Resolve the project root from this file's location:
#   TTS_Models/English_TTS/fastapi_server.py  →  ../../  = project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "TTS_Output" / "results"

# ── Global model reference ───────────────────────────────────────────────────
tts_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the XTTS v2 model once at startup; release on shutdown."""
    global tts_model

    # Ensure output directory exists (gitignored — won't exist on fresh clone)
    DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Output directory ready: {DEFAULT_OUTPUT_DIR}")

    # Some extracted/partial venvs may have a minimal/incomplete torch build
    # where `torch.cuda` isn't present. Fallback to CPU in that case.
    cuda = getattr(torch, "cuda", None)
    device = "cuda" if cuda is not None and cuda.is_available() else "cpu"
    logger.info(f"Loading xtts_v2 model on {device} …")

    from TTS.api import TTS

    tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    logger.info("Model loaded successfully.")

    yield  # app is running

    # Cleanup on shutdown
    tts_model = None
    logger.info("TTS model released.")


app = FastAPI(title="English TTS Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ───────────────────────────────────────────────
class TTSCloneRequest(BaseModel):
    text: str
    speaker_wav_paths: List[str]  # absolute paths to reference .wav files
    language: str = "en"
    output_path: Optional[str] = None  # absolute path; auto-generated if omitted


class TTSCloneResponse(BaseModel):
    job_id: str
    output_path: str
    duration_seconds: float


# ── Helpers ──────────────────────────────────────────────────────────────────
def preprocess_audio(src: str, dst: str) -> None:
    """Resample to 22 050 Hz mono PCM-16 WAV (what xtts_v2 expects)."""
    audio, _ = librosa.load(src, sr=22050, mono=True)
    sf.write(dst, audio, 22050, subtype="PCM_16")


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": tts_model is not None,
        "device": str(next(iter(tts_model.synthesizer.tts_model.parameters())).device)
        if tts_model
        else None,
    }


@app.post("/tts/clone", response_model=TTSCloneResponse)
async def tts_clone(req: TTSCloneRequest):
    if tts_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet — try again shortly.")

    # Validate inputs
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty.")
    if not req.speaker_wav_paths:
        raise HTTPException(status_code=400, detail="At least one speaker_wav_path is required.")

    for p in req.speaker_wav_paths:
        if not os.path.isfile(p):
            raise HTTPException(status_code=400, detail=f"Speaker WAV not found: {p}")

    # Determine output path
    job_id = str(uuid.uuid4())
    output_path = req.output_path or str(DEFAULT_OUTPUT_DIR / f"{job_id}.wav")

    # Ensure the parent directory of output_path exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Preprocess reference audio into a temporary directory that is
    # automatically cleaned up when done (or on error).
    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            preprocessed_paths: list[str] = []
            for i, src_path in enumerate(req.speaker_wav_paths):
                dst_path = os.path.join(tmp_dir, f"ref_{i}.wav")
                preprocess_audio(src_path, dst_path)
                preprocessed_paths.append(dst_path)
                logger.info(f"Preprocessed: {src_path} → {dst_path}")

            # Synthesize — speaker_wav accepts List[str] in xtts_v2 for
            # multi-speaker conditioning.
            logger.info(f"Synthesizing {len(req.text)} chars with {len(preprocessed_paths)} ref(s) …")
            start = time.time()

            tts_model.tts_to_file(
                text=req.text,
                speaker_wav=preprocessed_paths,
                language=req.language,
                file_path=str(output_path),
            )

            elapsed = round(time.time() - start, 2)
            logger.info(f"Synthesis complete in {elapsed}s → {output_path}")

        # Get audio duration of the generated file
        audio, sr = librosa.load(output_path, sr=None)
        duration_seconds = round(len(audio) / sr, 2)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Synthesis failed")
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")

    return TTSCloneResponse(
        job_id=job_id,
        output_path=str(output_path),
        duration_seconds=duration_seconds,
    )
