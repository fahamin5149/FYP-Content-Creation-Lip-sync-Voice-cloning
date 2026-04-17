import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SITE_PACKAGES = ROOT / "urdu_tts_env" / "urdu_tts_env" / "Lib" / "site-packages"

# These extracted venvs behave like "partial" venvs (no site init),
# so we must ensure Python can import local packages.
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(SITE_PACKAGES))

import uvicorn  # noqa: E402
import fastapi_server  # noqa: E402


if __name__ == "__main__":
    uvicorn.run(fastapi_server.app, host="0.0.0.0", port=8001)

