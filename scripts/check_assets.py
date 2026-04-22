#!/usr/bin/env python3
"""
Check required ML assets for local/dev runs.

Usage:
  python scripts/check_assets.py --assets-dir D:\FYP_ASSETS --mode minimal
  python scripts/check_assets.py --assets-dir D:\FYP_ASSETS --mode full
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys


REQUIRED_MINIMAL = [
    "tts_ur/openvoice_v2/converter/config.json",
    "tts_ur/openvoice_v2/converter/checkpoint.pth",
]

REQUIRED_FULL = REQUIRED_MINIMAL + [
    "wav2lip/checkpoints/wav2lip_gan.pth",
]

OPTIONAL_RECOMMENDED = [
    "tts_en/cache_hf",
    "tts_en/cache_torch",
    "tts_ur/cache_hf",
    "wav2lip/repo",
    "shared/temp",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate local asset layout for the FYP stack.")
    parser.add_argument(
        "--assets-dir",
        type=Path,
        default=None,
        help="Absolute path to asset root. If omitted, ASSETS_DIR env var is used.",
    )
    parser.add_argument(
        "--mode",
        choices=["minimal", "full"],
        default="minimal",
        help="Validation level. full checks extra Wav2Lip checkpoint.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    assets_dir = args.assets_dir
    if assets_dir is None:
        import os

        env_value = os.environ.get("ASSETS_DIR")
        if not env_value:
            print("[ERROR] Missing --assets-dir and ASSETS_DIR is not set.")
            return 2
        assets_dir = Path(env_value)

    assets_dir = assets_dir.resolve()
    print(f"[INFO] ASSETS_DIR: {assets_dir}")

    if not assets_dir.exists():
        print(f"[ERROR] Asset root does not exist: {assets_dir}")
        return 2

    required = REQUIRED_FULL if args.mode == "full" else REQUIRED_MINIMAL
    missing_required: list[str] = []

    print(f"[INFO] Validation mode: {args.mode}")
    for rel in required:
        p = assets_dir / rel
        if p.exists():
            print(f"[OK]    {rel}")
        else:
            print(f"[MISSING] {rel}")
            missing_required.append(rel)

    print("\n[INFO] Optional (recommended) paths:")
    for rel in OPTIONAL_RECOMMENDED:
        p = assets_dir / rel
        print(f"[OK]    {rel}" if p.exists() else f"[WARN]  {rel} (not found)")

    if missing_required:
        print("\n[FAIL] Missing required assets:")
        for rel in missing_required:
            print(f"  - {rel}")
        return 1

    print("\n[PASS] Required assets are present.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
