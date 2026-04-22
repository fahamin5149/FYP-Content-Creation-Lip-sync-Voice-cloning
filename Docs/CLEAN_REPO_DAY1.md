# Day 1 - Inventory, Freeze, and Target Structure

This document closes **Step 1 (Day 1)** of the clean-repo migration plan.

## 1) Inventory Snapshot (Completed)

Detected runnable services:

- Frontend (Next.js) at repo root
- Backend API (Express + TypeScript) at `server/`
- English TTS (FastAPI) at `English_TTS/englishttts/`
- Urdu TTS (FastAPI) at `Urdu_TTS/`
- Wav2Lip service (FastAPI) at `Wav2Lip_Service/`

Detected startup commands in current codebase:

```powershell
# Frontend
pnpm dev

# Backend
cd server
pnpm dev

# English TTS
.\English_TTS\englishttts\run_server.bat

# Urdu TTS
.\Urdu_TTS\run_server.bat

# Wav2Lip
.\Wav2Lip_Service\run_server_clean2.bat
```

Detected service ports:

- Frontend: `3000`
- Backend: `5000`
- English TTS: `8000`
- Urdu TTS: `8001`
- Wav2Lip: `8002`

## 2) Freeze Point (Completed)

Local repository state captured:

- Branch: `feat/content-pipeline-generation-ux`
- HEAD (at capture time): `eae2604`
- Working tree state: **dirty** (modified + untracked files present)

Important:

- No commit/tag was created in this step because local changes are not yet finalized.
- This freeze point is used as a reproducible reference before migration work starts.

Recommended optional freeze command (run only when ready):

```powershell
git tag day1-freeze-2026-04-20
```

## 3) Target Clean Structure (Agreed for Migration)

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

## 4) Day 1 Definition of Done

- [x] All runnable components identified
- [x] Current startup commands and ports documented
- [x] Freeze reference captured (branch + commit + dirty state)
- [x] Target clean structure selected for next migration step

## 5) Known Risks to Carry Into Day 2

- Hardcoded local paths in `.bat` scripts (for example `D:\DevCaches\...`)
- Python env setup differs between services
- Asset/checkpoint dependencies are external and must be packaged separately
- Repository contains generated/local files that should be excluded in clean repo
