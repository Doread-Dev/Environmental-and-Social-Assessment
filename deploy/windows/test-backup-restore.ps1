<#
  Backup + restore check (Windows): backs up the app's database and uploads into a temporary
  folder under BACKUP_DIR, restores that backup into an empty database (<db>_restore_check) and a
  temporary uploads folder, compares every collection count and every file (sha256), then removes
  the copies. The app's own database and files are only read. Run once after installing and after
  a MongoDB upgrade, in an administrator PowerShell:
    powershell -ExecutionPolicy Bypass -File C:\ESMS\deploy\windows\test-backup-restore.ps1
  -AllowSameDisk: only on a test machine with one disk. -Keep: keep the copies to look at them.
#>
param(
  [switch]$AllowSameDisk,
  [switch]$Keep
)
$ErrorActionPreference = 'Stop'
# Node writes UTF-8, but Windows PowerShell 5.1 decodes a native program's output with the console
# code page (a dash came out as three wrong characters, owner's service test 2026-11-06). Without a console
# (the scheduled task) there is nothing to set.
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch { }

$appDir = (Resolve-Path "$PSScriptRoot\..\..").Path
$node = (Get-Command node -ErrorAction Stop).Source

$scriptArgs = @('scripts\test-backup-restore.js')
if ($AllowSameDisk) { $scriptArgs += '--allow-same-disk' }
if ($Keep) { $scriptArgs += '--keep' }

Push-Location (Join-Path $appDir 'backend')
try {
  & $node @scriptArgs
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
