$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$index = Join-Path $here "QuickMark.html"

# Optional: fetch the markdown renderer if not already downloaded.
$vendor = Join-Path $here "vendor\\markdown-it.min.js"
if (!(Test-Path $vendor)) {
  try {
    & (Join-Path $here "setup.ps1") | Out-Null
  } catch {
    # If setup fails (offline, policy, etc.), the page will fall back to a CDN.
  }
}
Start-Process $index
