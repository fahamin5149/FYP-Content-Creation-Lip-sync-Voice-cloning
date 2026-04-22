# Day 2 - Clean Repo Creation and Asset Packaging

This document completes **Step 2 (Day 2)** of the migration plan with concrete actions and scripts.

## 1) Scope of Day 2

- Create a clean repo skeleton with clear service boundaries
- Define what to copy from current working tree
- Define what to exclude from Git
- Package large assets for teammate distribution (Google Drive)

## 2) Clean Repo Target (PROPOSED)

```text
PROPOSED: /
PROPOSED: /apps/frontend
PROPOSED: /apps/backend
PROPOSED: /services/tts-en
PROPOSED: /services/tts-ur
PROPOSED: /services/wav2lip
PROPOSED: /scripts
PROPOSED: /docs
PROPOSED: /infra/docker
PROPOSED: /.github/workflows
PROPOSED: /.env.example
PROPOSED: /.gitignore
PROPOSED: /docker-compose.yml
```

## 3) Copy Map: Current -> Clean Repo

- `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, `middleware.ts`, `next.config.mjs`, `tsconfig.json`, root `package.json`, `pnpm-lock.yaml`
  - -> `apps/frontend/`
- `server/src/`, `server/package.json`, `server/pnpm-lock.yaml`, `server/tsconfig*.json`, `server/.env.example`
  - -> `apps/backend/`
- `English_TTS/englishttts/*.py`, `English_TTS/englishttts/requirements.txt`
  - -> `services/tts-en/`
- `Urdu_TTS/*.py`, `Urdu_TTS/requirements.txt`
  - -> `services/tts-ur/`
- `Wav2Lip_Service/*.py`, `Wav2Lip_Service/requirements.txt`
  - -> `services/wav2lip/`
- Essential docs (`SETUP.md`, `TEAMMATE_SETUP_GUIDE.md`, architecture docs)
  - -> `docs/`

## 4) Exclude/Quarantine During Migration

Never copy into clean repo:

- `.env.local`, `server/.env`, any real secrets
- `node_modules/`, `.next/`, `dist/`, `*.log`, `*.tsbuildinfo`
- `TTS_Output/`, `LIPSYNC_Output/`, `uploads/`
- virtual env folders (`*_env`, `.venv`, `venv`)
- checkpoints and model binaries (`*.pth`, `*.pt`, `*.ckpt`, `*.safetensors`, `*.onnx`, `*.bin`)
- machine-specific cache folders (`HF_HOME`, `TORCH_HOME`, `TRANSFORMERS_CACHE`, `TTS_HOME`)

## 5) Asset Standard Root (PROPOSED)

Set one path on every teammate machine:

- `ASSETS_DIR=<absolute path to FYP_ASSETS>`

Expected structure:

```text
PROPOSED: FYP_ASSETS/
PROPOSED: FYP_ASSETS/tts_en/cache_hf/
PROPOSED: FYP_ASSETS/tts_en/cache_torch/
PROPOSED: FYP_ASSETS/tts_ur/openvoice_v2/converter/
PROPOSED: FYP_ASSETS/tts_ur/profiles/
PROPOSED: FYP_ASSETS/tts_ur/cache_hf/
PROPOSED: FYP_ASSETS/wav2lip/repo/
PROPOSED: FYP_ASSETS/wav2lip/checkpoints/
PROPOSED: FYP_ASSETS/shared/temp/
```

## 6) Packaging Commands (Google Drive Upload Prep)

Use script:

```powershell
.\scripts\package_assets.ps1 -AssetsDir "D:\FYP_ASSETS" -OutputDir "D:\FYP_ASSET_PACKS"
```

Output files:

- `fyp-assets-tts-ur-openvoice-v2-<tag>.zip`
- `fyp-assets-wav2lip-checkpoint-<tag>.zip`
- `fyp-assets-caches-<tag>.zip` (if cache path exists)
- `SHA256SUMS-<tag>.txt`

## 7) Teammate Verification Command

```powershell
python .\scripts\check_assets.py --assets-dir "D:\FYP_ASSETS" --mode minimal
python .\scripts\check_assets.py --assets-dir "D:\FYP_ASSETS" --mode full
```

## 8) Current Local Asset Findings (from this workspace)

- Found:
  - `checkpoints_v2/converter/config.json`
- Missing in repo (expected to be external or untracked):
  - `checkpoints_v2/converter/checkpoint.pth`
  - `wav2lip_gan.pth`
  - all other large model/checkpoint binaries

## 9) Day 2 Definition of Done

- [x] Clean target structure and copy map finalized
- [x] Include/exclude migration rules documented
- [x] Asset root and folder contract documented
- [x] Packaging script added (`scripts/package_assets.ps1`)
- [x] Verification script added (`scripts/check_assets.py`)
- [ ] Google Drive upload completed (**manual team action**)
- [ ] New clean repository physically created and populated (**manual execution next**)

## 10) Manual Actions Required From You

1. Create asset root and place required files into the proposed structure.
2. Run packaging script to produce zip files + checksums.
3. Upload generated zips and checksum file to shared Drive.
4. Confirm when done; then proceed to Day 3 (compose-based Dockerization).
