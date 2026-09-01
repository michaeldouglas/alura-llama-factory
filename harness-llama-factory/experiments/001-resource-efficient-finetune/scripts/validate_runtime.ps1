[CmdletBinding()]
param(
    [string]$OutputPath = 'experiments/001-resource-efficient-finetune/reports/runtime-g2-v2.json'
)

$ErrorActionPreference = 'Stop'

function Invoke-Captured {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $false)][string[]]$Arguments = @()
    )
    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $output = (& $FilePath @Arguments 2>&1 | Out-String).Trim()
    $ErrorActionPreference = $previousErrorAction
    [ordered]@{
        exit_code = [int]$LASTEXITCODE
        output = $output
    }
}

function Add-Issue {
    param([string]$Message)
    $script:issues += $Message
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$target = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
    [System.IO.Path]::GetFullPath($OutputPath)
} else {
    [System.IO.Path]::GetFullPath((Join-Path $repoRoot $OutputPath))
}
if (Test-Path -LiteralPath $target) {
    throw "G2 STOP: refusing to overwrite runtime evidence: $target"
}

$issues = @()
$gatePath = Join-Path $repoRoot 'experiments\001-resource-efficient-finetune\manifests\gates\g1-op-v4.json'
$lockPath = Join-Path $repoRoot 'experiments\001-resource-efficient-finetune\manifests\runtime-metadata-lock-g1-metadata-2-omegaconf-2.0.6-xpu-v4.json'
$g1EvidencePath = Join-Path $env:LOCALAPPDATA 'alura-llama-factory\001-resource-efficient-finetune\reports\g1-op-installation.json'
$environmentPath = Join-Path $env:LOCALAPPDATA 'alura-llama-factory\001-resource-efficient-finetune\environments\py312-xpu'
$pythonExe = Join-Path $environmentPath 'Scripts\python.exe'
$llamaCli = Join-Path $environmentPath 'Scripts\llamafactory-cli.exe'
$smokeScript = Join-Path $repoRoot 'experiments\001-resource-efficient-finetune\scripts\runtime_smoke.py'
$repoRootFull = [System.IO.Path]::GetFullPath($repoRoot).TrimEnd('\')
$environmentPathFull = [System.IO.Path]::GetFullPath($environmentPath).TrimEnd('\')

if (-not $env:LOCALAPPDATA) { Add-Issue 'LOCALAPPDATA is unavailable.' }
if (-not (Test-Path -LiteralPath $gatePath -PathType Leaf)) { Add-Issue "G1-OP-V4 gate is absent: $gatePath" }
if (-not (Test-Path -LiteralPath $lockPath -PathType Leaf)) { Add-Issue "v4 runtime lock is absent: $lockPath" }
if (-not (Test-Path -LiteralPath $g1EvidencePath -PathType Leaf)) { Add-Issue "G1 installation evidence is absent: $g1EvidencePath" }
if (-not (Test-Path -LiteralPath $pythonExe -PathType Leaf)) { Add-Issue "environment Python is absent: $pythonExe" }
if (-not (Test-Path -LiteralPath $llamaCli -PathType Leaf)) { Add-Issue "LLaMA-Factory CLI is absent: $llamaCli" }
if (-not (Test-Path -LiteralPath $smokeScript -PathType Leaf)) { Add-Issue "runtime smoke script is absent: $smokeScript" }
if ($environmentPathFull.StartsWith($repoRootFull + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    Add-Issue 'runtime environment is inside the repository.'
}

$gate = $null
$lock = $null
$g1Evidence = $null
if (Test-Path -LiteralPath $gatePath -PathType Leaf) {
    $gate = Get-Content -Raw -LiteralPath $gatePath | ConvertFrom-Json
    if ($gate.gate_id -ne 'G1-OP-V4' -or $gate.decision -ne 'APPROVED') { Add-Issue 'G1-OP-V4 is not approved.' }
}
if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
    $lock = Get-Content -Raw -LiteralPath $lockPath | ConvertFrom-Json
    $lockHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $lockPath).Hash
    if ($null -ne $gate -and $lockHash -ne $gate.lock_sha256) { Add-Issue 'v4 lock hash does not match G1-OP-V4.' }
}
if (Test-Path -LiteralPath $g1EvidencePath -PathType Leaf) {
    $g1Evidence = Get-Content -Raw -LiteralPath $g1EvidencePath | ConvertFrom-Json
    if ($g1Evidence.decision -ne 'COMPLETED') { Add-Issue 'G1 installation evidence is not COMPLETED.' }
}

$previousOffline = @{
    HF_HUB_OFFLINE = $env:HF_HUB_OFFLINE
    TRANSFORMERS_OFFLINE = $env:TRANSFORMERS_OFFLINE
    HF_DATASETS_OFFLINE = $env:HF_DATASETS_OFFLINE
}
$env:HF_HUB_OFFLINE = '1'
$env:TRANSFORMERS_OFFLINE = '1'
$env:HF_DATASETS_OFFLINE = '1'

$pipCheck = [ordered]@{ exit_code = $null; output = $null }
$llamaCheck = [ordered]@{ exit_code = $null; output = $null }
$identity = $null
$runtimeProbe = $null
$cpuDiagnostic = $null
try {
    if (Test-Path -LiteralPath $pythonExe -PathType Leaf) {
        $pipCheck = Invoke-Captured -FilePath 'uv' -Arguments @('pip', 'check', '--python', $pythonExe)
        if ($pipCheck.exit_code -ne 0) { Add-Issue 'uv pip check failed.' }

        $identityResult = Invoke-Captured -FilePath $pythonExe -Arguments @($smokeScript, '--mode', 'identity')
        $llamaCheck = $identityResult
        if ($identityResult.exit_code -ne 0) {
            Add-Issue 'LLaMA-Factory/Python runtime identity probe failed.'
        } else {
            $identity = $identityResult.output | ConvertFrom-Json
            if ($identity.llamafactory -ne '0.9.5') { Add-Issue "unexpected LLaMA-Factory version: $($identity.llamafactory)" }
            if ($identity.python_version -ne '3.12.12') { Add-Issue "unexpected Python version: $($identity.python_version)" }
            if ($identity.architecture -ne 'AMD64' -and $identity.architecture -ne 'x86_64') { Add-Issue "unexpected Python architecture: $($identity.architecture)" }
            if ([int]$identity.pointer_bits -ne 64) { Add-Issue 'Python is not 64-bit.' }
            if ($identity.xpu_available -ne $true -or [int]$identity.xpu_device_count -lt 1) { Add-Issue 'XPU is unavailable or has no device.' }
        }

        $probeResult = Invoke-Captured -FilePath $pythonExe -Arguments @($smokeScript, '--mode', 'xpu')
        if ($probeResult.exit_code -ne 0) {
            Add-Issue 'Synthetic XPU tensor/forward/backward/optimizer probe failed.'
        } else {
            $runtimeProbe = $probeResult.output | ConvertFrom-Json
            if ($runtimeProbe.finite_values -ne $true -or $runtimeProbe.finite_gradients -ne $true) { Add-Issue 'Synthetic XPU probe produced non-finite values.' }
        }

        $cpuResult = Invoke-Captured -FilePath $pythonExe -Arguments @($smokeScript, '--mode', 'cpu')
        if ($cpuResult.exit_code -eq 0) { $cpuDiagnostic = $cpuResult.output | ConvertFrom-Json } else { Add-Issue 'CPU diagnostic probe failed.' }
    }
} finally {
    foreach ($name in $previousOffline.Keys) {
        if ($null -eq $previousOffline[$name]) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue } else { Set-Item "Env:$name" $previousOffline[$name] }
    }
}

$decision = if ($issues.Count -eq 0) { 'READY' } else { 'BLOCKED' }
$report = [ordered]@{
    gate_id = 'G2'
    decision = $decision
    validated_at = (Get-Date).ToUniversalTime().ToString('o')
    validation_mode = 'LOCAL_READ_ONLY_RUNTIME_SMOKE'
    prerequisite_gate = 'G1-OP-V4'
    environment_path = $environmentPathFull
    environment_outside_repository = (-not $environmentPathFull.StartsWith($repoRootFull + '\', [System.StringComparison]::OrdinalIgnoreCase))
    lock_path = $lockPath
    lock_sha256 = if ($null -ne $gate) { $gate.lock_sha256 } else { $null }
    python = $identity
    dependency_check = $pipCheck
    llamafactory_check = $llamaCheck
    xpu_probe = $runtimeProbe
    cpu_diagnostic = $cpuDiagnostic
    prohibited_actions = [ordered]@{
        model_retrieved = $false
        dataset_retrieved = $false
        data_prepared = $false
        inference_run = $false
        baseline_run = $false
        training_run = $false
    }
    issues = $issues
    next_gate = if ($decision -eq 'READY') { 'G2-OP' } else { 'Resolve runtime blocker before G2-OP.' }
}

$parent = Split-Path -Parent $target
if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
$report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $target -Encoding UTF8
Write-Output $target
if ($decision -ne 'READY') { exit 2 }
