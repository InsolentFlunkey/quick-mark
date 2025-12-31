$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$vendorDir = Join-Path $here "vendor"
$outFile = Join-Path $vendorDir "markdown-it.min.js"

New-Item -ItemType Directory -Force $vendorDir | Out-Null

if (Test-Path $outFile) {
  Write-Host "Already present: $outFile"
  exit 0
}

$url = "https://unpkg.com/markdown-it@14.1.0/dist/markdown-it.min.js"
Write-Host "Downloading markdown-it from $url"
Invoke-WebRequest -Uri $url -OutFile $outFile

Write-Host "Wrote: $outFile"

