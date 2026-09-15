#requires -Version 5.1
<#
.SYNOPSIS
Runs the verified Windows x64 NSIS build from a prepared QuickMark checkout.
.PARAMETER Plan
Print the commands without probing tools, installing dependencies or building.
#>
[CmdletBinding()]
param([switch]$Plan)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Check native exit codes ourselves on both Windows PowerShell and PowerShell 7.
$PSNativeCommandUseErrorActionPreference = $false
$projectRoot = Split-Path -Parent $PSScriptRoot
$targetDirectory = Join-Path $projectRoot 'src-tauri/target'
$installerDirectory = Join-Path $targetDirectory 'release/bundle/nsis'
$steps = @(
    @{ Name = 'Install locked JavaScript dependencies'; Command = 'npm.cmd'; Arguments = @('ci', '--engine-strict') }
    @{ Name = 'Frontend tests'; Command = 'npm.cmd'; Arguments = @('test') }
    @{ Name = 'Frontend type check and production build'; Command = 'npm.cmd'; Arguments = @('run', 'build') }
    @{ Name = 'Production lint worker check'; Command = 'node'; Arguments = @('scripts/check-lint-worker.mjs') }
    @{ Name = 'Rust tests'; Command = 'cargo'; Arguments = @('test', '--locked', '--manifest-path', 'src-tauri/Cargo.toml') }
    @{ Name = 'Rust formatting'; Command = 'cargo'; Arguments = @('fmt', '--check', '--manifest-path', 'src-tauri/Cargo.toml') }
    @{ Name = 'Rust compile check'; Command = 'cargo'; Arguments = @('check', '--locked', '--manifest-path', 'src-tauri/Cargo.toml') }
    @{ Name = 'Windows NSIS package'; Command = 'npm.cmd'; Arguments = @('run', 'tauri', '--', 'build', '--bundles', 'nsis', '--', '--locked', '--target-dir', $targetDirectory) }
)

function Invoke-BuildCommand {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed (exit $LASTEXITCODE): $Command $($Arguments -join ' '). Resolve the error above and rerun scripts/build-windows.ps1."
    }
}

if ($Plan) {
    Write-Host "Checkout: $projectRoot"
    Write-Host 'Preflight: Windows x64, Node, npm.cmd, Rust/Cargo/rustup, MSVC Rust host.'
    foreach ($step in $steps) {
        Write-Host "$($step.Name): $($step.Command) $(($step.Arguments | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' ')"
    }
    Write-Host "Installer directory: $installerDirectory"
    return
}

$locationPushed = $false
try {
    if ($env:OS -ne 'Windows_NT' -or -not [Environment]::Is64BitOperatingSystem) {
        throw 'This script requires 64-bit Windows. See docs/build-windows.md for prerequisites.'
    }
    foreach ($command in @('node', 'npm.cmd', 'rustc', 'cargo', 'rustup')) {
        if (-not (Get-Command $command -CommandType Application -ErrorAction SilentlyContinue)) {
            throw "Missing prerequisite: $command. Install the tools in docs/build-windows.md and reopen PowerShell."
        }
    }
    Push-Location -LiteralPath $projectRoot
    $locationPushed = $true
    Write-Host "Building QuickMark from $projectRoot"
    $nodeVersion = (Invoke-BuildCommand 'node' @('--version') | Out-String).Trim()
    if ([version]($nodeVersion.TrimStart('v')) -lt [version]'22.22.2') {
        throw "Node $nodeVersion is too old. Use Node 22.22.2 or newer meeting the locked dependency engines (docs/build-windows.md)."
    }
    Write-Host "Node $nodeVersion"
    Invoke-BuildCommand 'npm.cmd' @('--version')
    $rustDetails = Invoke-BuildCommand 'rustc' @('-vV') | Out-String
    Write-Host $rustDetails.Trim()
    if ($rustDetails -notmatch '(?m)^host: x86_64-pc-windows-msvc\s*$') {
        throw 'Use the x86_64-pc-windows-msvc Rust toolchain described in docs/build-windows.md.'
    }
    Invoke-BuildCommand 'cargo' @('--version')
    Invoke-BuildCommand 'rustup' @('show', 'active-toolchain')

    $packageStarted = $null
    foreach ($step in $steps) {
        Write-Host "`n== $($step.Name) =="
        if ($step.Name -eq 'Windows NSIS package') { $packageStarted = [DateTime]::UtcNow }
        Invoke-BuildCommand $step.Command $step.Arguments
    }

    $executable = Join-Path $targetDirectory 'release/quick-mark.exe'
    if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
        throw "Packaging returned success but the executable is missing: $executable"
    }
    $installers = @()
    if (Test-Path -LiteralPath $installerDirectory -PathType Container) {
        $installers = @(Get-ChildItem -LiteralPath $installerDirectory -Filter '*.exe' -File |
            Where-Object { $_.LastWriteTimeUtc -ge $packageStarted -and $_.Length -gt 0 })
    }
    if ($installers.Count -eq 0) {
        throw "Packaging returned success but no newly written NSIS installer was found in $installerDirectory. Check the Tauri bundle output above; old installers are not a successful build."
    }
    Write-Host "`nWindows installer build succeeded."
    Write-Host "Executable: $executable"
    foreach ($installer in $installers) { Write-Host "Installer: $($installer.FullName)" }
    Write-Host 'Next: run the installer and follow docs/release-verification.md.'
} catch {
    Write-Error "Windows installer build stopped: $($_.Exception.Message)" -ErrorAction Continue
    exit 1
} finally {
    if ($locationPushed) { Pop-Location }
}
