$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)]
  [string]$AssetsDir,

  [Parameter(Mandatory = $true)]
  [string]$OutputDir,

  [Parameter(Mandatory = $false)]
  [string]$VersionTag = ""
)

function Write-Step([string]$Message) {
  Write-Host "[INFO] $Message"
}

function New-ZipIfExists([string]$SourcePath, [string]$ZipPath) {
  if (!(Test-Path -LiteralPath $SourcePath)) {
    Write-Host "[WARN] Skipping missing path: $SourcePath"
    return
  }

  if (Test-Path -LiteralPath $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
  }

  Write-Step "Creating zip: $ZipPath"
  Compress-Archive -Path $SourcePath -DestinationPath $ZipPath -CompressionLevel Optimal
}

$assetsRoot = (Resolve-Path -LiteralPath $AssetsDir).Path
if (!(Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}
$outputRoot = (Resolve-Path -LiteralPath $OutputDir).Path

$dateTag = Get-Date -Format "yyyyMMdd"
if ([string]::IsNullOrWhiteSpace($VersionTag)) {
  $VersionTag = $dateTag
}

Write-Step "Assets root: $assetsRoot"
Write-Step "Output dir : $outputRoot"
Write-Step "Version tag: $VersionTag"

$openvoice = Join-Path $assetsRoot "tts_ur\openvoice_v2\converter"
$wav2lipCkpt = Join-Path $assetsRoot "wav2lip\checkpoints\wav2lip_gan.pth"
$cacheRoot = Join-Path $assetsRoot "tts_en\cache_hf"

$zipOpenVoice = Join-Path $outputRoot "fyp-assets-tts-ur-openvoice-v2-$VersionTag.zip"
$zipWav2Lip = Join-Path $outputRoot "fyp-assets-wav2lip-checkpoint-$VersionTag.zip"
$zipCaches = Join-Path $outputRoot "fyp-assets-caches-$VersionTag.zip"

New-ZipIfExists -SourcePath $openvoice -ZipPath $zipOpenVoice
New-ZipIfExists -SourcePath $wav2lipCkpt -ZipPath $zipWav2Lip
New-ZipIfExists -SourcePath $cacheRoot -ZipPath $zipCaches

$shaFile = Join-Path $outputRoot "SHA256SUMS-$VersionTag.txt"
if (Test-Path -LiteralPath $shaFile) {
  Remove-Item -LiteralPath $shaFile -Force
}

Write-Step "Generating checksums..."
Get-ChildItem -Path $outputRoot -Filter "*.zip" |
  Sort-Object Name |
  ForEach-Object {
    $hash = Get-FileHash -Algorithm SHA256 -Path $_.FullName
    "$($hash.Hash)  $($_.Name)" | Out-File -FilePath $shaFile -Append -Encoding utf8
  }

Write-Step "Done."
Write-Host "[INFO] Generated files:"
Get-ChildItem -Path $outputRoot | Sort-Object Name | ForEach-Object { Write-Host "  - $($_.Name)" }
