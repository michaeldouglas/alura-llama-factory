$ErrorActionPreference = "Stop"

# T056/T057 — one guarded principal run. This script is intentionally strict:
# a completed/failed/stopped manifest blocks all retries.
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$experimentRoot = Join-Path $repo "experiments\001-resource-efficient-finetune"
$proposalPath = Join-Path $experimentRoot "manifests\execution-proposal.json"
$g7Path = Join-Path $experimentRoot "manifests\gates\g7.json"
$runManifestPath = Join-Path $experimentRoot "manifests\experiment-run.json"
$configPath = Join-Path $experimentRoot "configs\sft-lora-proposal.yaml"
$modelManifestPath = Join-Path $experimentRoot "manifests\model-source.json"
$datasetManifestPath = Join-Path $experimentRoot "manifests\dataset-info.json"
$g4Path = Join-Path $experimentRoot "manifests\gates\g4-derived.json"
$g5Path = Join-Path $experimentRoot "manifests\gates\g5-compatibility.json"
$g6ValidationPath = Join-Path $experimentRoot "manifests\gates\g6-validation.json"

function Get-Sha256([string] $Path) {
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Save-Manifest([hashtable] $Value) {
    $Value | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $runManifestPath -Encoding UTF8
}

if (Test-Path -LiteralPath $runManifestPath) {
    throw "Refusing retry: experiment-run.json already exists."
}

$proposal = Get-Content -Raw -LiteralPath $proposalPath | ConvertFrom-Json
$g7 = Get-Content -Raw -LiteralPath $g7Path | ConvertFrom-Json
$proposalHash = Get-Sha256 $proposalPath
$expectedProposalHash = "0014e5bd1d577bcabf72278f72922919af21e9c49152716b48ab5ab7741c573f"
if ($proposalHash -ne $expectedProposalHash -or $g7.decision -ne "APPROVED" -or $g7.proposal_sha256 -ne $proposalHash) {
    throw "G7/proposal identity mismatch; execution blocked."
}
if ($proposal.status -ne "PROPOSAL_ONLY" -or $proposal.principal_training_authorized -ne $false) {
    throw "Proposal state is not the frozen non-authorizing proposal state."
}
if ($g7.principal_training_authorized -ne $true -or $g7.owner_authorization.single_principal_run -ne $true) {
    throw "Exact single-run owner authorization is missing."
}

$expectedHashes = @{
    config = $proposal.configuration.config_sha256
    model_manifest = $proposal.model.manifest_sha256
    dataset_manifest = $proposal.dataset.manifest_sha256
    g4_derived = $proposal.dataset.gate_sha256
    g5_gate = $proposal.estimates_and_stop_conditions.g5_compatibility_gate_sha256
    g6_validation = $proposal.estimates_and_stop_conditions.g6_validation_gate_sha256
}
$actualHashes = @{
    config = Get-Sha256 $configPath
    model_manifest = Get-Sha256 $modelManifestPath
    dataset_manifest = Get-Sha256 $datasetManifestPath
    g4_derived = Get-Sha256 $g4Path
    g5_gate = Get-Sha256 $g5Path
    g6_validation = Get-Sha256 $g6ValidationPath
}
foreach ($key in $expectedHashes.Keys) {
    if ($actualHashes[$key] -ne $expectedHashes[$key]) {
        throw "Input hash mismatch for $key; execution blocked."
    }
}

$externalBase = Join-Path $env:LOCALAPPDATA "alura-llama-factory\001-resource-efficient-finetune"
$envPython = Join-Path $externalBase "environments\py312-xpu\Scripts\python.exe"
$cli = Join-Path $externalBase "environments\py312-xpu\Scripts\llamafactory-cli.exe"
$outputDir = [Environment]::ExpandEnvironmentVariables($proposal.outputs.output_dir.Replace("%LOCALAPPDATA%", $env:LOCALAPPDATA))
$loggingDir = [Environment]::ExpandEnvironmentVariables($proposal.outputs.logging_dir.Replace("%LOCALAPPDATA%", $env:LOCALAPPDATA))
if (-not (Test-Path -LiteralPath $envPython) -or -not (Test-Path -LiteralPath $cli)) {
    throw "Approved external runtime/CLI is missing; execution blocked."
}
if (Test-Path -LiteralPath $outputDir) {
    throw "Output collision at $outputDir; execution blocked."
}
New-Item -ItemType Directory -Path $loggingDir -Force | Out-Null
$stdoutLog = Join-Path $loggingDir "principal-run.stdout.log"
$stderrLog = Join-Path $loggingDir "principal-run.stderr.log"

$started = [DateTimeOffset]::UtcNow
$run = @{
    run_id = "001-resource-efficient-finetune-run-20260822"
    proposal_id = $proposal.proposal_id
    proposal_sha256 = $proposalHash
    gate = "G7"
    status = "RUNNING"
    started_at_utc = $started.ToString("o")
    finished_at_utc = $null
    exit_code = $null
    stop_reason = $null
    deviations = @()
    environment = @{ python = $envPython; cli = $cli; python_expected = "3.12.12"; torch_expected = "2.9.1+xpu"; llamafactory_expected = "0.9.5" }
    input_hashes = $actualHashes
    config_path = $configPath
    output_dir = $outputDir
    logging_dir = $loggingDir
    stdout_log = $stdoutLog
    stderr_log = $stderrLog
    hard_stop_minutes = 60
    retry_allowed = $false
    checkpoint_policy = "external output only; no overwrite; preserve all checkpoints"
}
Save-Manifest $run

$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"
$env:TOKENIZERS_PARALLELISM = "false"
$env:PYTHONUNBUFFERED = "1"
$process = $null
try {
    $process = Start-Process -FilePath $cli -ArgumentList @("train", $configPath) -WorkingDirectory $repo -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru
    $completed = $process.WaitForExit(60 * 60 * 1000)
    if (-not $completed) {
        $run.status = "STOPPED"
        $run.stop_reason = "HARD_STOP_60_MINUTES"
        try { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } catch {}
    } else {
        $run.exit_code = $process.ExitCode
        $run.status = if ($process.ExitCode -eq 0) { "COMPLETED" } else { "FAILED" }
        if ($process.ExitCode -ne 0) { $run.stop_reason = "LLAMAFACTORY_NONZERO_EXIT" }
    }
} catch {
    $run.status = "FAILED"
    $run.stop_reason = "RUNNER_EXCEPTION"
    $run.deviations = @($_.Exception.ToString())
} finally {
    $run.finished_at_utc = [DateTimeOffset]::UtcNow.ToString("o")
    $run.output_exists = Test-Path -LiteralPath $outputDir
    if ($run.status -eq "RUNNING") { $run.status = "FAILED"; $run.stop_reason = "RUNNER_DID_NOT_RECORD_TERMINAL_STATUS" }
    Save-Manifest $run
}

if ($run.status -ne "COMPLETED") {
    Write-Error ("Principal run ended with status {0}: {1}" -f $run.status, $run.stop_reason)
    exit 1
}
Write-Output ("Principal run completed. Manifest: {0}" -f $runManifestPath)
