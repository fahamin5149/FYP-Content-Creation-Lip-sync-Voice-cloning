import os
import json
import shutil
import subprocess
import tempfile
import time
import sys
from pathlib import Path
from typing import Any, Dict, Optional
import threading

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from huggingface_hub import hf_hub_download

app = FastAPI(title="Wav2Lip Lip-sync Service")


WAV2LIP_PORT = int(os.environ.get("WAV2LIP_PORT", "8002"))

# Where the Wav2Lip repo + inference.py live.
WAV2LIP_REPO_DIR = Path(os.environ.get("WAV2LIP_REPO_DIR", r"D:\DevCaches\wav2lip-src"))

# Checkpoint file for the standard Wav2Lip GAN model.
WAV2LIP_CHECKPOINT_PATH = Path(
    os.environ.get(
        "WAV2LIP_CHECKPOINT_PATH",
        r"D:\DevCaches\wav2lip-checkpoints\wav2lip_gan.pth",
    )
)

DEFAULT_PADS = [0, 10, 0, 0]
DEFAULT_CROP = [0, -1, 0, -1]
DEFAULT_BOX = [-1, -1, -1, -1]

WAV2LIP_REPO_URL = os.environ.get("WAV2LIP_REPO_URL", "https://github.com/Rudrabha/Wav2Lip.git")
WAV2LIP_CHECKPOINT_REPO_ID = os.environ.get("WAV2LIP_CHECKPOINT_REPO_ID", "rippertnt/wav2lip")
WAV2LIP_CHECKPOINT_FILENAME = os.environ.get("WAV2LIP_CHECKPOINT_FILENAME", "wav2lip_gan.pth")

# All face inputs are scaled to this width (height proportional, even) via ffmpeg before Wav2Lip.
FACE_PRESCALE_WIDTH = int(os.environ.get("WAV2LIP_FACE_WIDTH", "320"))

_BOOTSTRAPPED = False
_BOOTSTRAP_LOCK = threading.Lock()


def _bootstrap_once() -> None:
    global _BOOTSTRAPPED
    with _BOOTSTRAP_LOCK:
        if _BOOTSTRAPPED:
            return

    try:
        inference_py = WAV2LIP_REPO_DIR / "inference.py"
        if not inference_py.exists():
            WAV2LIP_REPO_DIR.parent.mkdir(parents=True, exist_ok=True)
            if WAV2LIP_REPO_DIR.exists() and any(WAV2LIP_REPO_DIR.iterdir()):
                # Directory exists but doesn't look like a valid repo.
                # We'll still attempt a fresh clone by continuing (fail will be clearer).
                pass
            else:
                subprocess.run(
                    ["git", "clone", "--depth", "1", WAV2LIP_REPO_URL, str(WAV2LIP_REPO_DIR)],
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                )

        if not WAV2LIP_CHECKPOINT_PATH.exists():
            WAV2LIP_CHECKPOINT_PATH.parent.mkdir(parents=True, exist_ok=True)
            hf_hub_download(
                repo_id=WAV2LIP_CHECKPOINT_REPO_ID,
                filename=WAV2LIP_CHECKPOINT_FILENAME,
                local_dir=str(WAV2LIP_CHECKPOINT_PATH.parent),
                local_dir_use_symlinks=False,
            )

        _BOOTSTRAPPED = True
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to bootstrap Wav2Lip: {e}")


class LipSyncRequest(BaseModel):
    videoPath: str
    audioPath: str
    userId: str
    jobId: Optional[str] = None
    # Output path is set by the caller (Next route) so we can serve it later.
    outputPath: str
    syncSettings: Dict[str, Any] = {}


def _bool_from_settings(settings: Dict[str, Any], key: str, default: bool) -> bool:
    val = settings.get(key, default)
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.strip().lower() in {"1", "true", "yes", "y", "on"}
    if isinstance(val, (int, float)):
        return bool(val)
    return default


def _int_from_settings(settings: Dict[str, Any], key: str, default: int) -> int:
    val = settings.get(key, default)
    try:
        return int(val)
    except Exception:
        return default


def _float_from_settings(settings: Dict[str, Any], key: str, default: float) -> float:
    val = settings.get(key, default)
    try:
        return float(val)
    except Exception:
        return default


def ensure_paths_exist(req: LipSyncRequest) -> None:
    _bootstrap_once()
    face = Path(req.videoPath)
    audio = Path(req.audioPath)
    out = Path(req.outputPath)

    if not face.exists():
        raise HTTPException(status_code=400, detail=f"Face video not found: {face}")
    if not audio.exists():
        raise HTTPException(status_code=400, detail=f"Audio not found: {audio}")
    out.parent.mkdir(parents=True, exist_ok=True)

    if not WAV2LIP_REPO_DIR.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Wav2Lip repo not found at {WAV2LIP_REPO_DIR}. Clone it first or set WAV2LIP_REPO_DIR.",
        )
    inference_py = WAV2LIP_REPO_DIR / "inference.py"
    if not inference_py.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Wav2Lip inference.py not found at {inference_py}.",
        )
    if not WAV2LIP_CHECKPOINT_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                f"Wav2Lip checkpoint not found at {WAV2LIP_CHECKPOINT_PATH}. "
                f"Download wav2lip_gan.pth first."
            ),
        )


def _is_static_face_image(path: Path) -> bool:
    return path.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def _ffmpeg_prescale_face_to_320(src: Path) -> Path:
    """
    Normalize any user-supplied face video/image to width FACE_PRESCALE_WIDTH (default 320)
    so Wav2Lip loads smaller frames and uses less RAM.
    """
    if not shutil.which("ffmpeg"):
        raise HTTPException(
            status_code=500,
            detail="ffmpeg not found on PATH. Install ffmpeg and restart the Wav2Lip service.",
        )

    w = FACE_PRESCALE_WIDTH
    is_img = _is_static_face_image(src)
    suffix = ".jpg" if is_img else ".mp4"
    fd, tmp_name = tempfile.mkstemp(prefix="wav2lip_prescale_", suffix=suffix)
    os.close(fd)
    dst = Path(tmp_name)

    if is_img:
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-vf",
            f"scale={w}:-2",
            "-q:v",
            "2",
            str(dst),
        ]
    else:
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-vf",
            f"scale={w}:-2",
            "-an",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-preset",
            "veryfast",
            str(dst),
        ]

    proc = subprocess.run(cmd)
    if proc.returncode != 0:
        dst.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail=(
                f"ffmpeg failed to scale face media to width {w} (exit {proc.returncode}). "
                "Check the Wav2Lip terminal for ffmpeg output."
            ),
        )

    if not dst.exists() or dst.stat().st_size == 0:
        dst.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail=f"ffmpeg produced an empty file while scaling to width {w}.",
        )

    return dst


def _patch_inference_for_windows() -> None:
    """
    The upstream Wav2Lip script ends with:
      subprocess.call(command, shell=platform.system() != 'Windows')
    which may break on Windows depending on Python behavior.
    We patch it once (best-effort) to use shell=True for Windows.
    """
    try:
        inference_py = WAV2LIP_REPO_DIR / "inference.py"
        if not inference_py.exists():
            return
        text = inference_py.read_text(encoding="utf-8", errors="ignore")
        needle = "subprocess.call(command, shell=platform.system() != 'Windows')"
        if needle not in text:
            return
        patched = text.replace(needle, "subprocess.call(command, shell=True)")
        inference_py.write_text(patched, encoding="utf-8")
    except Exception:
        # Non-fatal: if patch fails, inference might still work.
        pass


def _patch_inference_face_extension_check() -> None:
    """Use splitext instead of split('.')[1] so names like photo.backup.mp4 work; include webp/bmp."""
    try:
        inference_py = WAV2LIP_REPO_DIR / "inference.py"
        if not inference_py.exists():
            return
        text = inference_py.read_text(encoding="utf-8", errors="ignore")
        original = text
        old_static = (
            "if os.path.isfile(args.face) and args.face.split('.')[1] in ['jpg', 'png', 'jpeg']:\n"
            "\targs.static = True"
        )
        new_static = (
            "_face_ext = os.path.splitext(args.face)[1].lower().lstrip('.')\n"
            "if os.path.isfile(args.face) and _face_ext in (\"jpg\", \"jpeg\", \"png\", \"bmp\", \"webp\"):\n"
            "\targs.static = True"
        )
        if old_static in text:
            text = text.replace(old_static, new_static, 1)

        old_main = (
            "elif args.face.split('.')[1] in ['jpg', 'png', 'jpeg']:\n"
            "\t\tfull_frames = [cv2.imread(args.face)]"
        )
        new_main = (
            "elif _face_ext in (\"jpg\", \"jpeg\", \"png\", \"bmp\", \"webp\"):\n"
            "\t\tfull_frames = [cv2.imread(args.face)]"
        )
        if old_main in text:
            text = text.replace(old_main, new_main, 1)

        if text != original:
            inference_py.write_text(text, encoding="utf-8")
    except Exception:
        pass


def _patch_inference_static_bool_argparse() -> None:
    """
    Upstream Wav2Lip uses type=bool for --static. argparse passes strings; bool('false') is True
    in Python, so --static false forces single-frame (image-like) output. Fix the parser once.
    """
    try:
        inference_py = WAV2LIP_REPO_DIR / "inference.py"
        if not inference_py.exists():
            return
        text = inference_py.read_text(encoding="utf-8", errors="ignore")
        if "_wav2lip_str2bool" in text:
            return
        marker = "import platform\n"
        if marker not in text:
            return
        helper = """import platform


def _wav2lip_str2bool(v):
    if isinstance(v, bool):
        return v
    s = str(v).lower()
    if s in ("yes", "true", "t", "1", "on"):
        return True
    if s in ("no", "false", "f", "n", "0", "off"):
        return False
    raise argparse.ArgumentTypeError(f"Boolean value expected, got {v!r}")

"""
        text = text.replace(marker, helper, 1)
        text = text.replace(
            "parser.add_argument('--static', type=bool,",
            "parser.add_argument('--static', type=_wav2lip_str2bool,",
        )
        inference_py.write_text(text, encoding="utf-8")
    except Exception:
        pass


def _patch_audio_librosa_mel() -> None:
    """
    librosa 0.10+ requires keyword args for filters.mel(); upstream Wav2Lip uses positional sr/n_fft.
    """
    try:
        audio_py = WAV2LIP_REPO_DIR / "audio.py"
        if not audio_py.exists():
            return
        text = audio_py.read_text(encoding="utf-8", errors="ignore")
        needle = "return librosa.filters.mel(hp.sample_rate, hp.n_fft, n_mels=hp.num_mels,"
        if needle not in text:
            return
        patched = text.replace(
            needle,
            "return librosa.filters.mel(sr=hp.sample_rate, n_fft=hp.n_fft, n_mels=hp.num_mels,",
        )
        audio_py.write_text(patched, encoding="utf-8")
    except Exception:
        pass


def _run_wav2lip_inference(req: LipSyncRequest) -> float:
    start = time.time()

    settings = req.syncSettings or {}
    # Map our UI-style settings onto Wav2Lip args.
    wav2lip_pads = settings.get("pads", DEFAULT_PADS)
    crop = settings.get("crop", DEFAULT_CROP)
    box = settings.get("box", DEFAULT_BOX)

    # Upstream defaults (128 / 16 / resize 1) load every frame at full res into RAM; long 720p+
    # clips can exceed available memory. Safer service defaults; override via syncSettings.
    face_det_batch_size = _int_from_settings(settings, "face_det_batch_size", 8)
    wav2lip_batch_size = _int_from_settings(settings, "wav2lip_batch_size", 32)
    # Face media is already ffmpeg-scaled to FACE_PRESCALE_WIDTH before inference.
    resize_factor = _int_from_settings(settings, "resize_factor", 1)
    static = _bool_from_settings(settings, "static", False)
    nosmooth = _bool_from_settings(settings, "nosmooth", False)
    rotate = _bool_from_settings(settings, "rotate", False)

    fps = _float_from_settings(settings, "fps", 25.0)

    env = os.environ.copy()

    cmd = [
        sys.executable,
        "inference.py",
        "--checkpoint_path",
        str(WAV2LIP_CHECKPOINT_PATH),
        "--face",
        req.videoPath,
        "--audio",
        req.audioPath,
        "--outfile",
        req.outputPath,
        "--fps",
        str(fps),
        "--pads",
        str(wav2lip_pads[0]),
        str(wav2lip_pads[1]),
        str(wav2lip_pads[2]),
        str(wav2lip_pads[3]),
        "--face_det_batch_size",
        str(face_det_batch_size),
        "--wav2lip_batch_size",
        str(wav2lip_batch_size),
        "--resize_factor",
        str(resize_factor),
        "--crop",
        str(crop[0]),
        str(crop[1]),
        str(crop[2]),
        str(crop[3]),
        "--box",
        str(box[0]),
        str(box[1]),
        str(box[2]),
        str(box[3]),
    ]

    # Never pass "--static false": argparse type=bool does bool("false")==True. Omit = full video motion.
    if static:
        cmd.extend(["--static", "True"])

    # inference.py uses argparse action="store_true" for these.
    if rotate:
        cmd.append("--rotate")
    if nosmooth:
        cmd.append("--nosmooth")

    # Do not capture stdout/stderr: Wav2Lip prints progress to the console running Uvicorn.
    # Capturing hides logs and only surfaces truncated output in the HTTP error body.
    proc = subprocess.run(
        cmd,
        cwd=str(WAV2LIP_REPO_DIR),
        env=env,
    )
    if proc.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Wav2Lip failed (exit {proc.returncode}). "
                "See the terminal where the Wav2Lip service (port 8002) is running for the full traceback. "
                "If you see MemoryError, use a shorter input video and/or pass syncSettings.resize_factor "
                "(e.g. 3 or 4) to shrink frames."
            ),
        )

    return time.time() - start


@app.get("/health")
def health() -> Dict[str, Any]:
    ok = True
    errors = []
    try:
        inference_py = WAV2LIP_REPO_DIR / "inference.py"
        if not WAV2LIP_REPO_DIR.exists():
            ok = False
            errors.append(f"Wav2Lip repo missing: {WAV2LIP_REPO_DIR}")
        if not inference_py.exists():
            ok = False
            errors.append(f"inference.py missing: {inference_py}")
        if not WAV2LIP_CHECKPOINT_PATH.exists():
            ok = False
            errors.append(f"checkpoint missing: {WAV2LIP_CHECKPOINT_PATH}")
    except Exception as e:
        ok = False
        errors.append(str(e))

    cuda_ok = False
    cuda_name = None
    try:
        import torch

        cuda_ok = bool(torch.cuda.is_available())
        if cuda_ok:
            cuda_name = str(torch.cuda.get_device_name(0))
    except Exception:
        pass

    ffmpeg_ok = bool(shutil.which("ffmpeg"))
    if not ffmpeg_ok:
        errors.append("ffmpeg not on PATH — required to prescale face video before Wav2Lip")

    return {
        "status": "ok" if ok else "error",
        "errors": errors,
        "ffmpeg_on_path": ffmpeg_ok,
        "face_prescale_width": FACE_PRESCALE_WIDTH,
        "cuda_available": cuda_ok,
        "cuda_device": cuda_name,
    }


@app.post("/bootstrap")
def bootstrap() -> Dict[str, Any]:
    """
    Trigger the one-time Wav2Lip repo + checkpoint download in the background.
    This keeps `/health` fast and makes warmup explicit.
    """

    def _bg() -> None:
        try:
            _bootstrap_once()
        except Exception:
            # Errors will be reflected in future /health responses.
            pass

    t = threading.Thread(target=_bg, daemon=True)
    t.start()
    return {"success": True, "message": "Wav2Lip bootstrap started in background"}


@app.post("/lipsync")
def lipsync(req: LipSyncRequest) -> Dict[str, Any]:
    scaled: Optional[Path] = None
    try:
        ensure_paths_exist(req)
        _patch_inference_for_windows()
        _patch_inference_face_extension_check()
        _patch_inference_static_bool_argparse()
        _patch_audio_librosa_mel()
        scaled = _ffmpeg_prescale_face_to_320(Path(req.videoPath))
        payload = req.model_dump() if hasattr(req, "model_dump") else req.dict()
        payload["videoPath"] = str(scaled)
        req_scaled = LipSyncRequest(**payload)
        processing_time = _run_wav2lip_inference(req_scaled)
        return {
            "success": True,
            "videoPath": req.outputPath,
            "processingTime": processing_time,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if scaled is not None and scaled.exists():
            try:
                scaled.unlink()
            except OSError:
                pass

