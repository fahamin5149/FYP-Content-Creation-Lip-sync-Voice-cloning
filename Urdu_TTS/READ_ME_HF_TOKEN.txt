Hugging Face is required for Urdu TTS (gated model ai4bharat/indic-parler-tts)

1) Log in at https://huggingface.co
2) Open https://huggingface.co/ai4bharat/indic-parler-tts and accept the terms / request access.
3) Create an Access Token: https://huggingface.co/settings/tokens (read access is enough).

Then EITHER:
  A) Create a file in this folder named HF_TOKEN.txt with ONLY one line: your token (hf_...).
  B) Before running run_server.bat, run:  set HF_TOKEN=hf_...
  C) Run once: huggingface-cli login   (same venv Python)

Never commit HF_TOKEN.txt to Git.
