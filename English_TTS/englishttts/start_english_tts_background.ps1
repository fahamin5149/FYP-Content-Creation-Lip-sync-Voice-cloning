# Start English TTS on :8000; logs to english_tts_server.log in this folder.
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$env:HF_HOME = 'D:\DevCaches\hf'
$env:TRANSFORMERS_CACHE = 'D:\DevCaches\hf\transformers'
$env:TORCH_HOME = 'D:\DevCaches\torch'
$env:TTS_HOME = 'D:\DevCaches\TTS_HOME'
$env:COQUI_TOS_AGREED = '1'
New-Item -ItemType Directory -Path $env:HF_HOME, $env:TRANSFORMERS_CACHE, $env:TORCH_HOME, $env:TTS_HOME -Force | Out-Null
$py = Join-Path $here 'english_tts_env\english_tts_env\Scripts\python.exe'
$runner = Join-Path $here '_run_uvicorn.py'
$out = Join-Path $here 'english_tts_server.log'
$err = Join-Path $here 'english_tts_server.err.log'
$args = @('-u', $runner)
Start-Process -FilePath $py -ArgumentList $args -WorkingDirectory $here `
  -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden
Write-Host "Started. Logs: $out / $err"
Write-Host "Wait for model load then:  Invoke-WebRequest http://127.0.0.1:8000/health"
