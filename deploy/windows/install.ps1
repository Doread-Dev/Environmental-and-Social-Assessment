<#
  ESMS install on Windows (Windows Server 2019+ or Windows 10/11), from the unpacked release
  folder, no internet needed. In an administrator PowerShell:

    powershell -ExecutionPolicy Bypass -File .\deploy\windows\install.ps1 `
      -BackupDir E:\ESMS-backups -NssmPath C:\Tools\nssm\win64\nssm.exe -ConfigureMongo

  Steps (each is safe to run again; an update is the same command from the new release folder):
    1. checks: administrator, Node (the version in .nvmrc), NSSM, the MongoDB service, mongodump
    2. copies the release to -InstallDir (default C:\ESMS); creates the uploads, logs and backup
       folders
    3. backend\.env from deploy\config\esms.env.example with a new JWT_SECRET (an existing .env is
       kept as it is)
    4. -ConfigureMongo: adds the rs0 replica set to the MongoDB service's mongod.cfg (a copy is
       kept) and restarts MongoDB; then initiates the replica set (scripts\init-replica-set.js)
       and fills the lookup lists (src\db\seed.js, safe to run again)
    5. the ESMS Windows service (NSSM): starts with Windows, after MongoDB, restarts on a crash,
       runs as its own low-privilege account "NT SERVICE\<ServiceName>", logs in <InstallDir>\logs
    6. the scheduled task "<ServiceName> Backup": every day at -BackupTime (02:00)
    7. starts ESMS, waits for /health, runs scripts\check-server.js
#>
param(
  [Parameter(Mandatory = $true)][string]$BackupDir,
  [string]$InstallDir = 'C:\ESMS',
  [string]$UploadsDir = '',
  [string]$NssmPath = '',
  [string]$ServiceName = 'ESMS',
  [int]$Port = 3000,
  [string]$MongoServiceName = 'MongoDB',
  [string]$MongoConfigPath = '',
  [string]$MongoUri = 'mongodb://127.0.0.1:27017/esms?replicaSet=rs0',
  [string]$MongoToolsDir = 'C:\Program Files\MongoDB\Tools\100\bin',
  [switch]$ConfigureMongo,
  [string]$BackupTime = '02:00',
  [switch]$NoBackupTask
)
$ErrorActionPreference = 'Stop'

function Step($text) { Write-Host "`n== $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "FAILED: $text" -ForegroundColor Red; exit 1 }

# Runs a native command; its stderr is shown, not turned into a PowerShell error (5.1).
function Invoke-Native {
  param([string]$File, [string[]]$Arguments)
  $old = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $File @Arguments 2>&1 | ForEach-Object { "$_" } }
  finally { $ErrorActionPreference = $old }
}

function Set-EnvValue([string]$Text, [string]$Key, [string]$Value) {
  $pattern = "(?m)^$([regex]::Escape($Key))=.*$"
  $line = "$Key=$Value"
  # "$" in a replacement is special in .NET regex: "$$" writes one.
  if ($Text -match $pattern) { return [regex]::Replace($Text, $pattern, $line.Replace('$', '$$')) }
  return $Text.TrimEnd() + "`n$line`n"
}

$sourceDir = (Resolve-Path "$PSScriptRoot\..\..").Path
if (-not $UploadsDir) { $UploadsDir = Join-Path $InstallDir 'data\uploads' }
$logDir = Join-Path $InstallDir 'logs'
$serviceAccount = "NT SERVICE\$ServiceName"

# ---------------------------------------------------------------------------------------------
Step '1. Checks'
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { Fail 'run this in an administrator PowerShell' }

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) { Fail 'Node.js is not installed (INSTALL-WINDOWS.md, step 2)' }
$node = $nodeCmd.Source
$wanted = ((Get-Content (Join-Path $sourceDir '.nvmrc') -Raw).Trim() -replace '^v', '').Split('.')[0]
# Parsed here, not with node -p '...': Windows PowerShell 5.1 strips the double quotes inside an
# argument to a native program, so inline JavaScript breaks (backend/tests/deployScripts.test.js).
$have = ((& $node --version) -replace '^v', '').Split('.')[0]
if ($have -ne $wanted) { Fail "Node $have found, the app needs Node $wanted" }
Write-Host "Node $(& $node --version) at $node"

if (-not $NssmPath) {
  $nssmCmd = Get-Command nssm -ErrorAction SilentlyContinue
  if ($nssmCmd) { $NssmPath = $nssmCmd.Source }
}
if (-not $NssmPath -or -not (Test-Path $NssmPath)) { Fail 'nssm.exe not found: pass -NssmPath (INSTALL-WINDOWS.md, step 4)' }
Write-Host "NSSM at $NssmPath"

$mongoService = Get-Service -Name $MongoServiceName -ErrorAction SilentlyContinue
if (-not $mongoService) { Fail "the MongoDB service '$MongoServiceName' does not exist (INSTALL-WINDOWS.md, step 3)" }
if ($mongoService.Status -ne 'Running') { Start-Service $MongoServiceName }
Write-Host "MongoDB service '$MongoServiceName' is running"

$mongodump = Join-Path $MongoToolsDir 'mongodump.exe'
if (-not (Test-Path $mongodump)) { Fail "mongodump.exe not found in ${MongoToolsDir}: install the MongoDB Database Tools or pass -MongoToolsDir" }
foreach ($required in @('frontend\dist\index.html', 'backend\node_modules', 'backend\src\server.js')) {
  if (-not (Test-Path (Join-Path $sourceDir $required))) { Fail "$required is missing: use a release folder (deploy\build-release.mjs)" }
}

# ---------------------------------------------------------------------------------------------
Step '2. Files and folders'
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing -and $existing.Status -ne 'Stopped') {
  Write-Host "Stopping $ServiceName for the update"
  Stop-Service $ServiceName
}
New-Item -ItemType Directory -Force $InstallDir, $UploadsDir, $logDir, $BackupDir | Out-Null
$installFull = (Resolve-Path $InstallDir).Path
if ($sourceDir -ne $installFull) {
  # The new release replaces the old code; backend\.env, data and logs stay.
  $envFile = Join-Path $installFull 'backend\.env'
  $keptEnv = $null
  if (Test-Path $envFile) { $keptEnv = Get-Content $envFile -Raw }
  foreach ($part in @('backend', 'frontend', 'deploy', '.nvmrc', 'VERSION')) {
    $from = Join-Path $sourceDir $part
    if (-not (Test-Path $from)) { continue }
    $to = Join-Path $installFull $part
    if (Test-Path $to) { Remove-Item -Recurse -Force $to }
    Copy-Item -Recurse -Force $from $to
  }
  if ($null -ne $keptEnv) { [IO.File]::WriteAllText($envFile, $keptEnv) }
  Write-Host "Copied the release to $installFull"
}

# ---------------------------------------------------------------------------------------------
Step '3. Settings (backend\.env)'
$envFile = Join-Path $installFull 'backend\.env'
if (Test-Path $envFile) {
  Write-Host "Kept the existing $envFile"
}
else {
  # 48 random bytes, base64url (64 characters), from .NET: no inline JavaScript (see step 1).
  $bytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $secret = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  $text = Get-Content (Join-Path $installFull 'deploy\config\esms.env.example') -Raw
  $text = Set-EnvValue $text 'JWT_SECRET' $secret
  $text = Set-EnvValue $text 'PORT' "$Port"
  $text = Set-EnvValue $text 'MONGODB_URI' $MongoUri
  $text = Set-EnvValue $text 'UPLOADS_DIR' $UploadsDir
  $text = Set-EnvValue $text 'BACKUP_DIR' $BackupDir
  $text = Set-EnvValue $text 'MONGODB_TOOLS_DIR' $MongoToolsDir
  [IO.File]::WriteAllText($envFile, $text)
  Write-Host "Wrote $envFile with a new JWT_SECRET"
}

# ---------------------------------------------------------------------------------------------
Step '4. MongoDB replica set'
if ($ConfigureMongo) {
  if (-not $MongoConfigPath) {
    $imagePath = (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\$MongoServiceName").ImagePath
    if ($imagePath -match '--config\s+"([^"]+)"' -or $imagePath -match '--config\s+(\S+)') { $MongoConfigPath = $Matches[1] }
  }
  if (-not $MongoConfigPath -or -not (Test-Path $MongoConfigPath)) { Fail 'mongod.cfg not found: pass -MongoConfigPath' }
  $cfg = Get-Content $MongoConfigPath -Raw
  if ($cfg -match '(?m)^replication:') {
    Write-Host "$MongoConfigPath already has a replication block (left as it is)"
  }
  else {
    Copy-Item $MongoConfigPath "$MongoConfigPath.before-esms" -Force
    $block = "`r`n# Single-node replica set for ESMS transactions`r`nreplication:`r`n  replSetName: rs0`r`n"
    [IO.File]::WriteAllText($MongoConfigPath, $cfg.TrimEnd() + "`r`n" + $block)
    Write-Host "Added the rs0 replica set to $MongoConfigPath (copy: $MongoConfigPath.before-esms)"
    Restart-Service $MongoServiceName
    Start-Sleep -Seconds 3
  }
}
Push-Location (Join-Path $installFull 'backend')
try {
  Invoke-Native $node @('scripts\init-replica-set.js') | Write-Host
  if ($LASTEXITCODE -ne 0) { Fail 'the replica set is not ready (run again with -ConfigureMongo, or INSTALL-WINDOWS.md step 5)' }
  # The lookup lists (impact categories, questions, indicators, job titles); safe to run again.
  Invoke-Native $node @('src\db\seed.js') | Write-Host
  if ($LASTEXITCODE -ne 0) { Fail 'filling the lookup lists failed (see above)' }
}
finally { Pop-Location }

# ---------------------------------------------------------------------------------------------
Step "5. Windows service '$ServiceName' (NSSM)"
if (-not (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue)) {
  Invoke-Native $NssmPath @('install', $ServiceName, $node, 'src\server.js') | Write-Host
  if ($LASTEXITCODE -ne 0) { Fail "nssm install $ServiceName failed" }
}
$backendDir = Join-Path $installFull 'backend'
$settings = @(
  @('Application', $node),
  @('AppParameters', 'src\server.js'),
  @('AppDirectory', $backendDir),
  @('AppEnvironmentExtra', 'NODE_ENV=production'),
  # The service name, so a second install (a test one) never clashes: Windows refuses two
  # services with the same display name.
  @('DisplayName', $ServiceName),
  @('Description', 'ESMS - Environmental and Social Management System (Node.js)'),
  @('Start', 'SERVICE_AUTO_START'),
  @('AppStdout', (Join-Path $logDir 'esms-out.log')),
  @('AppStderr', (Join-Path $logDir 'esms-err.log')),
  @('AppRotateFiles', '1'),
  @('AppRotateOnline', '1'),
  @('AppRotateBytes', '10485760'),
  @('AppStopMethodConsole', '15000'),
  # No dependency on the MongoDB service (owner's service test, 2026-11-06): with one, stopping
  # or restarting MongoDB stopped ESMS too, and Windows never started it again. Instead the app
  # keeps running while MongoDB is away (requests fail meanwhile) and reconnects by itself; at
  # boot, server.js exits when MongoDB does not answer within 10 s and NSSM starts it again.
  @('AppExit', 'Default', 'Restart'),
  @('AppRestartDelay', '5000'),
  # An exit within 1.5 s of the start counts as a crash loop and NSSM waits longer each time. A
  # failed MongoDB connect exits only after the 10 s timeout, so boot retries stay every ~15 s.
  @('AppThrottle', '1500')
)
foreach ($s in $settings) {
  $out = Invoke-Native $NssmPath (@('set', $ServiceName) + $s)
  if ($LASTEXITCODE -ne 0) { Fail "nssm set $ServiceName $($s -join ' '): $out" }
}
# An install from before 2026-11-06 depended on MongoDB: clear it on an update.
Invoke-Native $NssmPath @('reset', $ServiceName, 'DependOnService') | Out-Null
$dependsOn = @((Get-Service -Name $ServiceName).ServicesDependedOn | ForEach-Object { $_.Name })
if ($dependsOn.Count -gt 0) { Fail "$ServiceName still depends on $($dependsOn -join ', '): run nssm reset $ServiceName DependOnService" }
# Its own low-privilege account: reads the app, writes only its uploads and logs.
Invoke-Native sc.exe @('config', $ServiceName, 'obj=', $serviceAccount) | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "could not set the service account $serviceAccount" }
Invoke-Native icacls.exe @($installFull, '/grant', "${serviceAccount}:(OI)(CI)RX", '/T', '/Q') | Out-Null
foreach ($dir in @($UploadsDir, $logDir)) {
  Invoke-Native icacls.exe @($dir, '/grant', "${serviceAccount}:(OI)(CI)M", '/T', '/Q') | Out-Null
}
# backend\.env holds the JWT secret: administrators, SYSTEM and the service only.
Invoke-Native icacls.exe @($envFile, '/inheritance:r', '/grant:r', 'Administrators:F', 'SYSTEM:F', "${serviceAccount}:R") | Out-Null
Write-Host "Service '$ServiceName' runs as $serviceAccount; logs in $logDir"

# ---------------------------------------------------------------------------------------------
Step '6. Daily backup task'
if ($NoBackupTask) {
  Write-Host 'Skipped (-NoBackupTask)'
}
else {
  $taskName = "$ServiceName Backup"
  $script = Join-Path $installFull 'deploy\windows\backup.ps1'
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -LogDir `"$logDir`""
  $trigger = New-ScheduledTaskTrigger -Daily -At $BackupTime
  # SYSTEM reaches a network share as the computer account (DOMAIN\SERVER$): give that account
  # write access on the share, or change the task's account (INSTALL-WINDOWS.md, step 9).
  $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
  $taskSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 4)
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal `
    -Settings $taskSettings -Description 'ESMS daily backup: database + uploads (deploy\windows\backup.ps1)' -Force | Out-Null
  Write-Host "Scheduled task '$taskName': every day at $BackupTime"
}

# ---------------------------------------------------------------------------------------------
Step '7. Start and check'
Start-Service $ServiceName
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "http://127.0.0.1:$Port/health"
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  }
  catch { Start-Sleep -Seconds 1 }
}
if (-not $ok) { Fail "ESMS does not answer on port ${Port}: see $logDir\esms-err.log" }
Write-Host "ESMS answers on http://127.0.0.1:$Port/health"
Push-Location $backendDir
try { Invoke-Native $node @('scripts\check-server.js') | Write-Host }
finally { Pop-Location }

Write-Host "`nDone. Next (INSTALL-WINDOWS.md): IIS with HTTPS (deploy\proxy\iis-web.config), the first"
Write-Host "admin (cd $backendDir; node scripts\create-admin.js), and one restore check"
Write-Host "(deploy\windows\test-backup-restore.ps1)."
