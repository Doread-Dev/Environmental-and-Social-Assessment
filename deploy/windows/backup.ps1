<#
  ESMS daily backup (Windows): the database (mongodump) + a copy of UPLOADS_DIR into BACKUP_DIR;
  backups older than BACKUP_KEEP_DAYS are deleted (never the newest). Settings: backend\.env.
  The scheduled task "ESMS Backup" (install.ps1) runs it every day at 02:00. By hand, in an
  administrator PowerShell:
    powershell -ExecutionPolicy Bypass -File C:\ESMS\deploy\windows\backup.ps1
  Exit code 0 = a new backup was written. The output is also appended to <LogDir>\backup.log.
#>
param(
  [string]$LogDir = $(if ($env:ESMS_LOG_DIR) { $env:ESMS_LOG_DIR } else { "$PSScriptRoot\..\..\logs" })
)
$ErrorActionPreference = 'Stop'
# Node writes UTF-8, but Windows PowerShell 5.1 decodes a native program's output with the console
# code page (a dash came out as three wrong characters, owner's service test 2026-11-06). Without a console
# (the scheduled task) there is nothing to set.
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch { }

$appDir = (Resolve-Path "$PSScriptRoot\..\..").Path
$node = (Get-Command node -ErrorAction Stop).Source
New-Item -ItemType Directory -Force $LogDir | Out-Null
$log = Join-Path $LogDir 'backup.log'

Push-Location (Join-Path $appDir 'backend')
try {
  "==== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') backup" | Out-File -Append -Encoding utf8 $log
  # Node's stderr is merged in as text; with 'Continue', PowerShell 5.1 does not turn those lines
  # into a terminating error. Arguments go as an array, never one quoted string (5.1 strips
  # inner double quotes of native arguments).
  $ErrorActionPreference = 'Continue'
  $output = & $node scripts\backup.js @args 2>&1 | ForEach-Object { "$_" }
  $code = $LASTEXITCODE
  $ErrorActionPreference = 'Stop'
  $output | Out-File -Append -Encoding utf8 $log
  $output | Write-Output
  exit $code
}
finally {
  Pop-Location
}
