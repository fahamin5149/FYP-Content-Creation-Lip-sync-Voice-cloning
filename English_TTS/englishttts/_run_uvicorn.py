"""One-shot launcher for English TTS (used by start_english_tts_background.ps1)."""
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_SITE = os.path.join(_HERE, "english_tts_env", "english_tts_env", "Lib", "site-packages")
sys.path.insert(0, _HERE)
sys.path.insert(0, _SITE)

os.chdir(_HERE)

import uvicorn
import fastapi_server

uvicorn.run(fastapi_server.app, host="127.0.0.1", port=8000, log_level="info")
