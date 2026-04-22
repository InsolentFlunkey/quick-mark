[CmdletBinding()]
param(
  # Prepare dependencies without launching the browser (replaces the old setup.ps1).
  [switch]$Setup
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$vendorDir = Join-Path $here "vendor"
$markdownItPath = Join-Path $vendorDir "markdown-it.min.js"
$readmePath = Join-Path $here "README.md"
$readmeJsPath = Join-Path $vendorDir "readme.js"
$indexPath = Join-Path $here "QuickMark.html"

New-Item -ItemType Directory -Force $vendorDir | Out-Null

# --- 1. Ensure vendor/markdown-it.min.js --------------------------------------
if (Test-Path $markdownItPath) {
  Write-Host "Already present: $markdownItPath"
} else {
  $url = "https://unpkg.com/markdown-it@14.1.0/dist/markdown-it.min.js"
  try {
    Write-Host "Downloading markdown-it from $url"
    Invoke-WebRequest -Uri $url -OutFile $markdownItPath
    Write-Host "Wrote: $markdownItPath"
  } catch {
    # Offline / blocked / etc. QuickMark.html will fall back to the CDN at runtime.
    Write-Warning "Could not download markdown-it: $($_.Exception.Message)"
  }
}

# --- 2. Regenerate vendor/readme.js from README.md ----------------------------
if (Test-Path $readmePath) {
  # Read as UTF-8 via .NET so we bypass PowerShell's PSObject-wrapped Get-Content
  # (which pollutes ConvertTo-Json with provider properties) and preserve
  # non-ASCII characters like curly quotes.
  $content = [System.IO.File]::ReadAllText($readmePath, [System.Text.Encoding]::UTF8)
  if ($null -eq $content) { $content = "" }

  # ConvertTo-Json on a plain [string] produces a valid JSON string literal,
  # which is also a valid JavaScript string literal.
  $json = ConvertTo-Json -InputObject ([string]$content) -Compress
  $js = "window.__README__ = $json;`n"

  $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText($readmeJsPath, $js, $utf8NoBom)
  Write-Host "Wrote: $readmeJsPath"
} else {
  Write-Host "README.md not found at $readmePath - skipping readme.js"
}

# --- 3. Launch (unless -Setup was passed) -------------------------------------
if ($Setup) {
  Write-Host "Setup complete. Skipping launch (-Setup specified)."
  return
}

Start-Process $indexPath
