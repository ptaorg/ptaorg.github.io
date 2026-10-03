$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$launcher = Join-Path $repoRoot 'tools\pta-ai\run.mjs'
$binDir = Join-Path $HOME 'bin'
$cmdPath = Join-Path $binDir 'pta-ai.cmd'
$runsDir = Join-Path $HOME 'Documents\PTA-AI\runs'

New-Item -ItemType Directory -Force -Path $binDir | Out-Null
New-Item -ItemType Directory -Force -Path $runsDir | Out-Null

$lines = @('@echo off', ('node "' + $launcher + '" %*'))
[System.IO.File]::WriteAllLines($cmdPath, $lines, [System.Text.UTF8Encoding]::new($false))

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$parts = @()
if ($userPath) { $parts = $userPath.Split(';') | Where-Object { $_ } }
if ($parts -notcontains $binDir) {
  [Environment]::SetEnvironmentVariable('Path', (($parts + $binDir) -join ';'), 'User')
}
[Environment]::SetEnvironmentVariable('PTA_AI_RUNS_DIR', $runsDir, 'User')

Write-Host ('Installed: ' + $cmdPath)
Write-Host ('Runs: ' + $runsDir)
Write-Host 'Open a new terminal, then use:'
Write-Host '  pta-ai --check'
Write-Host '  pta-ai "松山市の最新状況を整理"'