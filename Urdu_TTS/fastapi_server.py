"""
Urdu Voice Cloning — FastAPI Service
=====================================
Two-stage zero-shot pipeline (no per-user model training):

  Stage 1 — Indic Parler-TTS
    Urdu text + style description → clean base audio with accurate phonetics

  Stage 2 — MyShell OpenVoice V2
    Reference clip(s) → tone-color embedding → injected into base audio
    Preserves pronunciation/emotion from Stage 1, swaps voice identity

Endpoints:
  GET  /health      — readiness check
  POST /tts/urdu    — synthesize (JSON in, JSON out)

Environment variables (set in run_server.bat or shell):
  OPENVOICE_CONVERTER_DIR   Absolute path to checkpoints_v2/converter folder
                            Default: <project_root>/checkpoints_v2/converter
  URDU_PROFILES_DIR         Directory for per-user adaptive .pt embeddings
                            Default: <project_root>/TTS_Output/urdu_profiles
"""

import gc
import logging
import os
import re
import uuid
import time
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List

import numpy as np

import torch
import librosa
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── ML imports — require urdu_tts_env to be active ───────────────────────────
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
from openvoice import se_extractor
from openvoice.api import ToneColorConverter

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("urdu-tts-service")

# ── Path resolution ───────────────────────────────────────────────────────────
# __file__ = <project_root>/Urdu_TTS/fastapi_server.py
# parent   = <project_root>/Urdu_TTS/
# parent.parent = <project_root>/
PROJECT_ROOT = Path(__file__).resolve().parent.parent

OPENVOICE_CONVERTER_DIR = Path(
    os.environ.get(
        "OPENVOICE_CONVERTER_DIR",
        str(PROJECT_ROOT / "checkpoints_v2" / "converter"),
    )
)

URDU_PROFILES_DIR = Path(
    os.environ.get(
        "URDU_PROFILES_DIR",
        str(PROJECT_ROOT / "TTS_Output" / "urdu_profiles"),
    )
)

DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "TTS_Output" / "urdu"

# ── Style presets → Parler-TTS description prompts ───────────────────────────
# Each preset maps to a curated description that controls gender/pace/tone.
# Prompts are kept short and specific for consistent Indic Parler-TTS output.
STYLE_PRESETS: dict[str, str] = {
    "neutral_male": (
        "A male speaker with a clear and neutral voice speaks in Urdu "
        "at a moderate pace."
    ),
    "neutral_female": (
        "A female speaker with a clear and neutral voice speaks in Urdu "
        "at a moderate pace."
    ),
    "slow_clear": (
        "A speaker with a very clear and deliberate voice speaks in Urdu "
        "slowly, carefully enunciating each word."
    ),
    "expressive": (
        "A speaker with an expressive and dynamic voice speaks in Urdu "
        "with varying emotion and natural energy."
    ),
}
DEFAULT_PRESET = "neutral_male"

# ── Global model references ───────────────────────────────────────────────────
tts_model = None
tts_tokenizer = None
tone_color_converter = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    import traceback as _traceback
    global tts_model, tts_tokenizer, tone_color_converter

    # ── Pre-flight checks ─────────────────────────────────────────────────────
    if not OPENVOICE_CONVERTER_DIR.exists():
        raise RuntimeError(
            f"OpenVoice V2 converter not found at: {OPENVOICE_CONVERTER_DIR}\n"
            "Set OPENVOICE_CONVERTER_DIR environment variable to the correct path.\n"
            "Expected contents: config.json, checkpoint.pth"
        )

    # Ensure output directories exist (gitignored — not tracked)
    URDU_PROFILES_DIR.mkdir(parents=True, exist_ok=True)
    DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Profiles dir  : {URDU_PROFILES_DIR}")
    logger.info(f"Output dir    : {DEFAULT_OUTPUT_DIR}")

    # Allow forcing CPU via env var (useful if CUDA causes issues)
    device = os.environ.get("URDU_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device        : {device}")

    def _load_models(target_device: str) -> None:
        global tts_model, tts_tokenizer, tone_color_converter
        local_device = target_device

        # ── Load Indic Parler-TTS ─────────────────────────────────────────────
        model_name = "ai4bharat/indic-parler-tts"
        logger.info(f"Loading Indic Parler-TTS ({model_name}) on {local_device} ...")
        tts_model = ParlerTTSForConditionalGeneration.from_pretrained(model_name).to(local_device)
        tts_tokenizer = AutoTokenizer.from_pretrained(model_name)
        logger.info("Parler-TTS loaded.")

        # ── Load OpenVoice V2 Tone Color Converter ────────────────────────────
        config_path = str(OPENVOICE_CONVERTER_DIR / "config.json")
        ckpt_path = str(OPENVOICE_CONVERTER_DIR / "checkpoint.pth")
        logger.info(f"Loading OpenVoice V2 converter from {OPENVOICE_CONVERTER_DIR} on {local_device} ...")
        tone_color_converter = ToneColorConverter(config_path, device=local_device)
        tone_color_converter.load_ckpt(ckpt_path)
        logger.info("OpenVoice V2 loaded.")

    try:
        _load_models(device)
    except Exception:
        # If CUDA is requested but the CUDA runtime DLLs are missing (common on some
        # systems), we fall back to CPU so the service still works.
        error_text = _traceback.format_exc()
        is_cublas_issue = ("cublas" in error_text.lower()) and ("dll" in error_text.lower())
        if device != "cpu" and is_cublas_issue:
            logger.warning("CUDA runtime missing (likely cublas). Falling back to CPU for Urdu TTS.")
            _load_models("cpu")
        else:
            # Write the full traceback to a log file so it is never lost even if
            # the console window closes before it can be read.
            logger.error("=" * 60)
            logger.error("STARTUP FAILED — full traceback below:")
            logger.error(error_text)
            log_path = PROJECT_ROOT / "urdu_tts_error.log"
            try:
                import time as _time
                with open(log_path, "w", encoding="utf-8") as _f:
                    _f.write(f"Startup failed at: {_time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                    _f.write(f"Device attempted : {device}\n")
                    _f.write(f"OPENVOICE_CONVERTER_DIR: {OPENVOICE_CONVERTER_DIR}\n\n")
                    _f.write(error_text)
                logger.error(f"Error saved to: {log_path}")
            except Exception:
                pass
            logger.error("=" * 60)
            raise

    logger.info("Urdu TTS service ready on :8001")
    yield

    # ── Cleanup on shutdown ───────────────────────────────────────────────────
    tts_model = None
    tts_tokenizer = None
    tone_color_converter = None
    logger.info("Models released.")


app = FastAPI(title="Urdu TTS Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ────────────────────────────────────────────────

class UrduTTSRequest(BaseModel):
    text: str
    speaker_wav_paths: List[str]   # absolute paths to reference .wav files on disk
    output_path: str               # absolute path where output .wav will be written
    style_preset: str = DEFAULT_PRESET
    user_id: str                   # Clerk user ID — key for adaptive embedding profile


class UrduTTSResponse(BaseModel):
    job_id: str
    output_path: str
    duration_seconds: float


# ── Helpers ───────────────────────────────────────────────────────────────────

def _chunk_text(text: str, max_chars: int = 150) -> List[str]:
    """
    Split Urdu text into short chunks at sentence/clause boundaries.
    Parler-TTS degrades on long inputs — keep each chunk under ~10 seconds
    of expected audio (~150 chars is a safe heuristic for Urdu).
    """
    # Split on Urdu sentence endings (۔ ؟ !) or newlines, keeping delimiter
    parts = re.split(r'(?<=[۔؟!\n])\s*', text.strip())
    parts = [p.strip() for p in parts if p.strip()]

    chunks: List[str] = []
    current = ""
    for part in parts:
        if len(current) + len(part) + 1 <= max_chars:
            current = (current + " " + part).strip()
        else:
            if current:
                chunks.append(current)
            # If a single part is itself too long, split at commas/spaces
            if len(part) > max_chars:
                words = part.split()
                current = ""
                for w in words:
                    if len(current) + len(w) + 1 <= max_chars:
                        current = (current + " " + w).strip()
                    else:
                        if current:
                            chunks.append(current)
                        current = w
            else:
                current = part
    if current:
        chunks.append(current)

    return chunks


def _average_embeddings(paths: List[str], converter, se_tmp_dir: str, vad: bool) -> torch.Tensor:
    """Extract SE embedding from each path and return their mean."""
    combined = None
    for p in paths:
        se, _ = se_extractor.get_se(p, converter, target_dir=se_tmp_dir, vad=vad)
        combined = se if combined is None else (combined + se) / 2
    return combined


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    models_ready = tts_model is not None and tone_color_converter is not None
    device_str = None
    if tts_model is not None:
        try:
            device_str = str(next(iter(tts_model.parameters())).device)
        except Exception:
            pass
    return {
        "status": "ok" if models_ready else "loading",
        "models_loaded": models_ready,
        "device": device_str,
        "profiles_dir": str(URDU_PROFILES_DIR),
    }


@app.post("/tts/urdu", response_model=UrduTTSResponse)
async def urdu_tts(req: UrduTTSRequest):
    if tts_model is None or tone_color_converter is None:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded yet — try again shortly.",
        )

    # ── Input validation ──────────────────────────────────────────────────────
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty.")

    if not req.speaker_wav_paths:
        raise HTTPException(
            status_code=400,
            detail="At least one speaker_wav_path is required.",
        )

    for p in req.speaker_wav_paths:
        if not os.path.isfile(p):
            raise HTTPException(
                status_code=400,
                detail=f"Speaker WAV not found on disk: {p}",
            )

    preset = req.style_preset if req.style_preset in STYLE_PRESETS else DEFAULT_PRESET
    description = STYLE_PRESETS[preset]

    os.makedirs(os.path.dirname(req.output_path), exist_ok=True)

    job_id = str(uuid.uuid4())
    device = next(iter(tts_model.parameters())).device

    logger.info(f"[{job_id}] Starting — preset={preset}, clips={len(req.speaker_wav_paths)}, user={req.user_id[:8]}...")

    # Use a per-request temp directory — ensures concurrent requests don't conflict
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        base_audio_path = str(tmp_path / "base.wav")
        se_tmp_dir = str(tmp_path / "se_tmp")
        os.makedirs(se_tmp_dir, exist_ok=True)

        try:
            # ── Stage 1: Parler-TTS base audio generation (chunked) ──────────
            logger.info(f"[{job_id}] Stage 1: Parler-TTS synthesis...")
            t1 = time.time()

            # Description tokens are reused for every chunk
            desc_inputs = tts_tokenizer(description, return_tensors="pt").to(device)

            # Split text into short chunks — model degrades on long single-pass inputs
            chunks = _chunk_text(req.text)
            logger.info(f"[{job_id}] Text split into {len(chunks)} chunk(s)")

            # ~86 audio frames/sec at 44100 Hz / 512 hop; 1200 tokens ≈ 14 seconds
            MAX_NEW_TOKENS_PER_CHUNK = 1200
            SILENCE_DURATION = 0.25  # seconds of silence between chunks

            audio_pieces: List[np.ndarray] = []
            silence = np.zeros(
                int(tts_model.config.sampling_rate * SILENCE_DURATION), dtype=np.float32
            )

            for i, chunk in enumerate(chunks):
                logger.info(f"[{job_id}] Chunk {i + 1}/{len(chunks)}: {chunk[:60]}...")
                prompt_inputs = tts_tokenizer(chunk, return_tensors="pt").to(device)
                generation = tts_model.generate(
                    input_ids=desc_inputs.input_ids,
                    attention_mask=desc_inputs.attention_mask,
                    prompt_input_ids=prompt_inputs.input_ids,
                    prompt_attention_mask=prompt_inputs.attention_mask,
                    max_new_tokens=MAX_NEW_TOKENS_PER_CHUNK,
                )
                audio_pieces.append(generation.cpu().numpy().squeeze().astype(np.float32))
                if i < len(chunks) - 1:
                    audio_pieces.append(silence)
                del prompt_inputs, generation
                gc.collect()
                torch.cuda.empty_cache()

            combined_audio = np.concatenate(audio_pieces)
            sf.write(base_audio_path, combined_audio, tts_model.config.sampling_rate)

            # Free description inputs before Stage 2
            del desc_inputs, audio_pieces, combined_audio
            gc.collect()
            torch.cuda.empty_cache()

            logger.info(f"[{job_id}] Stage 1 done in {round(time.time() - t1, 2)}s")

            # ── Stage 2: OpenVoice V2 tone color transfer ──────────────────────
            logger.info(f"[{job_id}] Stage 2: Extracting tone color embeddings...")
            t2 = time.time()

            # Source SE: what the Parler-TTS voice sounds like (vad=False — clean TTS)
            source_se, _ = se_extractor.get_se(
                base_audio_path,
                tone_color_converter,
                target_dir=se_tmp_dir,
                vad=False,
            )

            # Target SE: average embedding across all selected reference clips
            current_se = _average_embeddings(
                req.speaker_wav_paths,
                tone_color_converter,
                se_tmp_dir,
                vad=True,
            )

            # ── Adaptive profile: load → average → save ────────────────────────
            # Profile is keyed by Clerk user ID so it persists across sessions.
            # Each new generation averages the fresh embedding with the saved one,
            # progressively refining the voice clone without any retraining.
            profile_path = URDU_PROFILES_DIR / f"{req.user_id}.pt"

            if profile_path.exists():
                logger.info(f"[{job_id}] Merging with existing profile (user {req.user_id[:8]})...")
                profile_data = torch.load(str(profile_path), weights_only=True)
                saved_se: torch.Tensor = profile_data["se"].to(current_se.device)
                upload_count: int = profile_data["count"]
                adaptive_se = ((saved_se * upload_count) + current_se) / (upload_count + 1)
                new_count = upload_count + 1
            else:
                logger.info(f"[{job_id}] Creating new profile for user {req.user_id[:8]}...")
                adaptive_se = current_se
                new_count = 1

            torch.save({"se": adaptive_se, "count": new_count}, str(profile_path))
            logger.info(f"[{job_id}] Profile saved (session count: {new_count})")

            # ── Final conversion: base audio → cloned voice ────────────────────
            logger.info(f"[{job_id}] Running voice conversion...")
            tone_color_converter.convert(
                audio_src_path=base_audio_path,
                src_se=source_se,
                tgt_se=adaptive_se,
                output_path=req.output_path,
                message="@MyShell",
            )

            logger.info(f"[{job_id}] Stage 2 done in {round(time.time() - t2, 2)}s")

        except HTTPException:
            raise
        except Exception as e:
            logger.exception(f"[{job_id}] Synthesis failed")
            raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")

    # ── Measure output duration ───────────────────────────────────────────────
    audio, sr = librosa.load(req.output_path, sr=None)
    duration_seconds = round(len(audio) / sr, 2)

    total = round(time.time() - t1, 2)
    logger.info(
        f"[{job_id}] Complete — {duration_seconds}s audio, {total}s wall time → {req.output_path}"
    )

    return UrduTTSResponse(
        job_id=job_id,
        output_path=req.output_path,
        duration_seconds=duration_seconds,
    )
