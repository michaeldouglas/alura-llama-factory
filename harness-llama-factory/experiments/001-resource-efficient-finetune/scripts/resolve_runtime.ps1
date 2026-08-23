[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$target = [System.IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $target) {
    throw "Refusing to overwrite runtime proposal: $target"
}
if (-not $env:LOCALAPPDATA) {
    throw 'LOCALAPPDATA is unavailable; no fallback location is allowed.'
}

$externalRoot = Join-Path $env:LOCALAPPDATA 'alura-llama-factory\001-resource-efficient-finetune'
$proposal = [ordered]@{
    proposal_id = 'runtime-proposal-g1-2026-08-21'
    generated_at = (Get-Date).ToUniversalTime().ToString('o')
    generation_mode = 'OFFLINE_READ_ONLY'
    network_access_performed = $false
    installation_performed = $false
    environment_path = (Join-Path $externalRoot 'environments\py312-xpu')
    cache_paths = [ordered]@{
        uv = (Join-Path $externalRoot 'cache\uv')
        sources = (Join-Path $externalRoot 'cache\sources')
        model = (Join-Path $externalRoot 'cache\model')
    }
    python = [ordered]@{
        version = '3.12'
        architecture = 'x86_64'
        acquisition = 'uv-managed CPython after approval'
        immutable_distribution_identity = $null
    }
    exact_direct_requirements = @(
        [ordered]@{ name = 'LlamaFactory'; version = '0.9.5'; revision = '7af909522a951e3ad9f022ea6f88b6755257eaa5'; source = 'https://github.com/hiyouga/LlamaFactory' },
        [ordered]@{ name = 'torch'; version = '2.9.1+xpu'; source = 'https://download.pytorch.org/whl/xpu/' },
        [ordered]@{ name = 'torchvision'; version = '0.24.1+xpu'; source = 'https://download.pytorch.org/whl/xpu/' },
        [ordered]@{ name = 'torchaudio'; version = '2.9.1+xpu'; source = 'https://download.pytorch.org/whl/xpu/' }
    )
    unresolved_requirements = @(
        'Exact CPython distribution URL, size and SHA-256',
        'Exact LlamaFactory transitive dependency versions and wheel hashes',
        'Exact scikit-learn version and transitive wheel hashes',
        'Total network transfer and installed disk impact'
    )
    future_network_endpoints = @(
        'https://github.com/hiyouga/LlamaFactory',
        'https://download.pytorch.org/whl/xpu/',
        'https://pypi.org/',
        'uv-managed Python distribution endpoint to be resolved'
    )
    policy = [ordered]@{
        source_builds = 'DENY'
        nightly_packages = 'DENY'
        python_3_14 = 'DENY_FOR_TRAINING_ENVIRONMENT'
        silent_cpu_fallback = 'DENY'
        remote_or_paid_compute = 'DENY'
        overwrite = 'DENY'
    }
    expected_download_bytes = $null
    expected_installed_bytes = $null
    readiness = 'NEEDS_METADATA_RESOLUTION_AUTHORIZATION'
    next_action = 'Request narrowly scoped authorization to resolve package metadata without installation before G1-OP can be presented.'
}

$parent = Split-Path -Parent $target
if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent | Out-Null }
$proposal | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $target -Encoding utf8NoBOM -NoNewline
Write-Output $target
