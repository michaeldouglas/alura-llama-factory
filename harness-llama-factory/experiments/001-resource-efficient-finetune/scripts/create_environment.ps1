[CmdletBinding()]
param(
    [string]$GatePath = 'experiments/001-resource-efficient-finetune/manifests/gates/g1-op-v4.json',
    [string]$LockPath = 'experiments/001-resource-efficient-finetune/manifests/runtime-metadata-lock-g1-metadata-2-omegaconf-2.0.6-xpu-v4.json',
    [switch]$ResumeExistingEnvironment
)

$ErrorActionPreference = 'Stop'

function Stop-WithMessage([string]$Message) {
    throw "G1-OP STOP: $Message"
}

function Invoke-Checked([string]$FilePath, [string[]]$Arguments) {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "$FilePath exited with code $LASTEXITCODE"
    }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$gateTarget = if ([System.IO.Path]::IsPathRooted($GatePath)) { $GatePath } else { Join-Path $repoRoot $GatePath }
$lockTarget = if ([System.IO.Path]::IsPathRooted($LockPath)) { $LockPath } else { Join-Path $repoRoot $LockPath }

if (-not (Test-Path -LiteralPath $gateTarget -PathType Leaf)) { Stop-WithMessage "G1-OP gate is absent: $gateTarget" }
if (-not (Test-Path -LiteralPath $lockTarget -PathType Leaf)) { Stop-WithMessage "runtime lock is absent: $lockTarget" }
if (-not $env:LOCALAPPDATA) { Stop-WithMessage 'LOCALAPPDATA is unavailable; no fallback location is allowed.' }

$gate = Get-Content -Raw -LiteralPath $gateTarget | ConvertFrom-Json
$lock = Get-Content -Raw -LiteralPath $lockTarget | ConvertFrom-Json
if ($gate.gate_id -ne 'G1-OP-V4') { Stop-WithMessage 'gate identity is not G1-OP-V4' }
if ($gate.decision -ne 'APPROVED') { Stop-WithMessage 'G1-OP is not approved' }
if ($gate.superseded -eq $true -or $gate.revoked -eq $true) { Stop-WithMessage 'G1-OP is superseded or revoked' }
$requiredActions = @('create_environment', 'resume_partial_environment', 'install_locked_dependencies', 'install_llamafactory_at_pinned_revision', 'write_g1_op_evidence')
foreach ($action in $requiredActions) {
    if ($gate.authorized_actions -notcontains $action) { Stop-WithMessage "G1-OP action is missing: $action" }
}

$actualLockHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $lockTarget).Hash
if ($actualLockHash -ne $gate.lock_sha256) { Stop-WithMessage "runtime lock hash mismatch: expected $($gate.lock_sha256), got $actualLockHash" }
if ($lock.lock_status -ne 'COMPLETE_METADATA_ONLY_LOCK') { Stop-WithMessage "runtime lock is not complete: $($lock.lock_status)" }
if ($lock.payload_downloads_performed -eq $true -or $lock.environment_created -eq $true -or $lock.packages_installed -eq $true) {
    Stop-WithMessage 'runtime lock contains evidence of an earlier operational action'
}

$externalRoot = Join-Path $env:LOCALAPPDATA 'alura-llama-factory\001-resource-efficient-finetune'
$environmentPath = Join-Path $externalRoot 'environments\py312-xpu'
$cacheRoot = Join-Path $externalRoot 'cache'
$uvCache = Join-Path $cacheRoot 'uv'
$requirementsPath = Join-Path $cacheRoot 'runtime-lock-g1-metadata-2-omegaconf-2.0.6-xpu-v4.requirements.txt'
$evidenceRoot = Join-Path $externalRoot 'reports'
$evidencePath = Join-Path $evidenceRoot 'g1-op-installation.json'
$expectedEnvironment = '%LOCALAPPDATA%/alura-llama-factory/001-resource-efficient-finetune/environments/py312-xpu'
if ($gate.environment_path -ne $expectedEnvironment) { Stop-WithMessage 'G1-OP environment path is not the approved path' }
if ((Test-Path -LiteralPath $environmentPath) -and -not $ResumeExistingEnvironment) {
    Stop-WithMessage "approved environment path already exists; use -ResumeExistingEnvironment only for an interrupted G1-OP run: $environmentPath"
}
if (Test-Path -LiteralPath $evidencePath) { Stop-WithMessage "refusing to overwrite evidence: $evidencePath" }

$driveRoot = [System.IO.Path]::GetPathRoot($externalRoot)
$driveName = $driveRoot.TrimEnd('\')
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$driveName'"
if ($null -eq $disk -or $null -eq $disk.FreeSpace) { Stop-WithMessage "could not read free space for $driveRoot" }
if ([int64]$disk.FreeSpace -lt [int64]$gate.storage_policy.minimum_free_bytes_before) {
    Stop-WithMessage "free space is below the approved pre-install threshold"
}

New-Item -ItemType Directory -Force -Path $uvCache, $evidenceRoot | Out-Null
$env:UV_CACHE_DIR = $uvCache
$env:UV_NO_CONFIG = '1'
$env:UV_NATIVE_TLS = '1'

Invoke-Checked 'uv' @('python', 'install', '3.12.12')
$pythonExe = Join-Path $environmentPath 'Scripts\python.exe'
if (-not (Test-Path -LiteralPath $environmentPath)) {
    Invoke-Checked 'uv' @('venv', '--python', '3.12.12', $environmentPath)
}
if (-not (Test-Path -LiteralPath $pythonExe -PathType Leaf)) { Stop-WithMessage "environment Python was not created: $pythonExe" }

$requirementLines = @()
foreach ($item in $lock.resolved_requirements) {
    $wheel = $item.wheel
    if ($item.status -ne 'CANDIDATE' -or $null -eq $wheel -or [string]::IsNullOrWhiteSpace($wheel.url) -or [string]::IsNullOrWhiteSpace($wheel.sha256)) {
        Stop-WithMessage "lock item is not an installable hashed wheel: $($item.name)"
    }
    $requirementLines += "$($wheel.url) --hash=sha256:$($wheel.sha256)"
}
Set-Content -LiteralPath $requirementsPath -Value ($requirementLines -join [Environment]::NewLine) -Encoding UTF8
Invoke-Checked 'uv' @('pip', 'install', '--python', $pythonExe, '--require-hashes', '--no-deps', '--requirement', $requirementsPath)

$llamaSpec = "git+https://github.com/hiyouga/LlamaFactory@$($lock.llamafactory.revision)"
Invoke-Checked 'uv' @('pip', 'install', '--python', $pythonExe, '--no-deps', $llamaSpec)
Invoke-Checked 'uv' @('pip', 'check', '--python', $pythonExe)

$versionOutput = & $pythonExe '--version'
if ($LASTEXITCODE -ne 0 -or $versionOutput -notmatch 'Python 3\.12\.12') { Stop-WithMessage "created interpreter version mismatch: $versionOutput" }
$freeAfter = (Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$driveName'").FreeSpace
if ([int64]$freeAfter -lt [int64]$gate.storage_policy.minimum_free_bytes_after) {
    Stop-WithMessage 'free space crossed the approved post-install threshold'
}

$evidence = [ordered]@{
    gate_id = 'G1-OP-V4'
    decision = 'COMPLETED'
    completed_at = (Get-Date).ToUniversalTime().ToString('o')
    gate_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $gateTarget).Hash
    lock_path = $lockTarget
    lock_sha256 = $actualLockHash
    environment_path = $environmentPath
    python = $versionOutput
    llamafactory_revision = $lock.llamafactory.revision
    resolved_requirement_count = $lock.resolved_requirements.Count
    requirements_file = $requirementsPath
    free_bytes_before = [int64]$disk.FreeSpace
    free_bytes_after = [int64]$freeAfter
    payloads_requested = $true
    model_retrieved = $false
    dataset_retrieved = $false
    data_prepared = $false
    inference_run = $false
    training_run = $false
}
$evidence | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $evidencePath -Encoding UTF8 -NoNewline
Write-Output $evidencePath
