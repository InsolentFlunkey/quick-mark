param([string]$RunName = (Get-Date -Format 'yyyyMMdd-HHmmss'), [int]$WatchdogSeconds = 90)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$outputDirectory = Join-Path $PSScriptRoot 'runs'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
if ($RunName -notmatch '^[a-zA-Z0-9_-]+$') { throw 'RunName must be a simple filename stem.' }
$eventsPath = Join-Path $outputDirectory "$RunName-native.jsonl"
$memoryPath = Join-Path $outputDirectory "$RunName-memory.jsonl"
if ((Test-Path $eventsPath) -or (Test-Path $memoryPath)) { throw 'Choose a new RunName; existing results are never overwritten.' }
$machine = @{ kind = 'machine'; os = (Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,TotalVisibleMemorySize);
  cpu = (Get-CimInstance Win32_Processor | Select-Object Name,NumberOfLogicalProcessors); at = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
$machine | ConvertTo-Json -Depth 5 -Compress | Set-Content -LiteralPath $memoryPath -Encoding utf8
$oldOutput = $env:QUICKMARK_BENCH_OUTPUT
$env:QUICKMARK_BENCH_OUTPUT = $eventsPath
$benchmark = $null
try {
  $benchmark = Start-Process -FilePath (Join-Path $projectRoot 'src-tauri/target/debug/quick-mark.exe') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
  $lastProgress = Get-Date
  $lastLength = 0
  while (-not $benchmark.HasExited) {
    $processes = @(Get-CimInstance Win32_Process)
    $ids = [System.Collections.Generic.HashSet[int]]::new()
    [void]$ids.Add($benchmark.Id)
    do {
      $changed = $false
      foreach ($process in $processes) {
        if ($ids.Contains([int]$process.ParentProcessId) -and $ids.Add([int]$process.ProcessId)) { $changed = $true }
      }
    } while ($changed)
    $members = @(Get-Process -Id @($ids) -ErrorAction SilentlyContinue)
    @{ kind = 'memory'; at = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); processes = $members.Count;
      workingSet = ($members | Measure-Object WorkingSet64 -Sum).Sum;
      privateBytes = ($members | Measure-Object PrivateMemorySize64 -Sum).Sum;
      responsive = $benchmark.Responding } | ConvertTo-Json -Compress | Add-Content -LiteralPath $memoryPath -Encoding utf8
    if (Test-Path $eventsPath) {
      $size = (Get-Item $eventsPath).Length
      if ($size -ne $lastLength) {
        $lastProgress = Get-Date; $lastLength = $size
        $last = Get-Content -LiteralPath $eventsPath -Tail 1 | ConvertFrom-Json
        Write-Output "$($last.kind): $($last.name) $($last.operation)"
      }
    }
    if (((Get-Date) - $lastProgress).TotalSeconds -gt $WatchdogSeconds) {
      throw "No benchmark checkpoint for $WatchdogSeconds seconds; preserve partial output and stop this run."
    }
    Start-Sleep -Seconds 1
    $benchmark.Refresh()
  }
  $final = if (Test-Path $eventsPath) { Get-Content -LiteralPath $eventsPath -Tail 1 | ConvertFrom-Json }
  if ($final.kind -ne 'done') { throw "Benchmark did not finish: $($final | ConvertTo-Json -Compress)" }
  Write-Output "Complete: $eventsPath"
} finally {
  $env:QUICKMARK_BENCH_OUTPUT = $oldOutput
  if ($benchmark -and -not $benchmark.HasExited) { $benchmark.Kill($true); $benchmark.WaitForExit() }
}
