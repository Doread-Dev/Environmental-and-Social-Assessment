<#
  Restores one ESMS backup (Windows): the database and the uploads folder. Moving to a new server
  is the same: install ESMS there, then restore the latest backup. In an administrator PowerShell:
    Stop-Service ESMS
    powershell -ExecutionPolicy Bypass -File C:\ESMS\deploy\windows\restore.ps1 -From E:\ESMS-backups\esms-20261105-020000Z
    Start-Service ESMS
  It asks you to type RESTORE first. -Yes skips the question; -Strict fails when a count differs.
  The database in the backup replaces the app's database; an uploads folder that is not empty is
  kept next to it as "<folder>.before-restore-<time>", never deleted.
#>
param(
  [Parameter(Mandatory = $true)][string]$From,
  [string]$ServiceName = 'ESMS',
  [switch]$Yes,
  [switch]$Strict
)
$ErrorActionPreference = 'Stop'

$appDir = (Resolve-Path "$PSScriptRoot\..\..").Path
$node = (Get-Command node -ErrorAction Stop).Source
$fromPath = (Resolve-Path $From).Path

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -ne 'Stopped') {
  Write-Error "The $ServiceName service is running. Stop it first: Stop-Service $ServiceName"
  exit 1
}

$scriptArgs = @('scripts\restore.js', '--from', $fromPath)
if ($Yes) { $scriptArgs += '--yes' }
if ($Strict) { $scriptArgs += '--strict' }

Push-Location (Join-Path $appDir 'backend')
try {
  & $node @scriptArgs
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
