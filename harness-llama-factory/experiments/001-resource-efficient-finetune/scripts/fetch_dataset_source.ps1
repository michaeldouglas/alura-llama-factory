[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$GatePath = Join-Path $Root "experiments\001-resource-efficient-finetune\manifests\gates\g3.json"
$ManifestPath = Join-Path $Root "experiments\001-resource-efficient-finetune\manifests\dataset-source.json"
$Repository = "cardiffnlp/tweet_sentiment_multilingual"
$Revision = "606156db529f327fd871515cccbe14dcbafef682"
$Configuration = "portuguese"

function Stop-G3([string]$Message) { throw "G3 STOP: $Message" }

function Assert-AllowedUri([string]$UriText, [string[]]$AllowedHosts) {
    try { $uri = [Uri]$UriText } catch { Stop-G3 "invalid URL: $UriText" }
    if ($uri.Scheme -ne "https" -or $AllowedHosts -notcontains $uri.Host.ToLowerInvariant()) { Stop-G3 "URL host or scheme is not approved: $UriText" }
    return $uri
}

function Get-RedirectUri([Uri]$BaseUri, $Location) {
    return ([Uri]::new($BaseUri, ([Uri]$Location))).AbsoluteUri
}

function Invoke-G3GetText([string]$UriText, [string[]]$AllowedHosts) {
    $current = $UriText
    for ($redirect = 0; $redirect -le 5; $redirect++) {
        $uri = Assert-AllowedUri $current $AllowedHosts
        $handler = [System.Net.Http.HttpClientHandler]::new()
        $handler.AllowAutoRedirect = $false
        $client = [System.Net.Http.HttpClient]::new($handler)
        $response = $null
        try {
            $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $uri)
            $request.Headers.UserAgent.ParseAdd("alura-llama-factory-g3/1.0")
            $response = $client.Send($request)
            if ([int]$response.StatusCode -ge 300 -and [int]$response.StatusCode -lt 400) {
                if ($null -eq $response.Headers.Location) { Stop-G3 "redirect without Location: $current" }
                $current = Get-RedirectUri $uri $response.Headers.Location
                continue
            }
            if (-not $response.IsSuccessStatusCode) { Stop-G3 "HTTP $([int]$response.StatusCode) for $current" }
            return $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        } finally {
            if ($null -ne $response) { $response.Dispose() }
            $client.Dispose()
            $handler.Dispose()
        }
    }
    Stop-G3 "too many redirects for $UriText"
}

function Get-G3File([string]$UriText, [string]$Target, [Int64]$ExpectedSize, [string[]]$AllowedHosts) {
    $current = $UriText
    for ($redirect = 0; $redirect -le 5; $redirect++) {
        $uri = Assert-AllowedUri $current $AllowedHosts
        $handler = [System.Net.Http.HttpClientHandler]::new()
        $handler.AllowAutoRedirect = $false
        $client = [System.Net.Http.HttpClient]::new($handler)
        $response = $null
        $output = $null
        $input = $null
        $temp = "$Target.part"
        try {
            $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $uri)
            $request.Headers.UserAgent.ParseAdd("alura-llama-factory-g3/1.0")
            $response = $client.Send($request, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead)
            if ([int]$response.StatusCode -ge 300 -and [int]$response.StatusCode -lt 400) {
                if ($null -eq $response.Headers.Location) { Stop-G3 "redirect without Location: $current" }
                $current = Get-RedirectUri $uri $response.Headers.Location
                continue
            }
            if (-not $response.IsSuccessStatusCode) { Stop-G3 "HTTP $([int]$response.StatusCode) for $current" }
            if ($null -ne $response.Content.Headers.ContentLength -and [Int64]$response.Content.Headers.ContentLength -ne $ExpectedSize) { Stop-G3 "Content-Length mismatch for $Target" }
            if (Test-Path -LiteralPath $Target -PathType Leaf) { Stop-G3 "refusing to overwrite $Target" }
            if (Test-Path -LiteralPath $temp) { Stop-G3 "partial target already exists: $temp" }
            $input = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
            $output = [System.IO.File]::Open($temp, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
            $buffer = New-Object byte[] (1024 * 1024)
            $total = [Int64]0
            while (($read = $input.Read($buffer, 0, $buffer.Length)) -gt 0) { $output.Write($buffer, 0, $read); $total += $read }
            $output.Flush(); $output.Dispose(); $output = $null
            $input.Dispose(); $input = $null
            if ($total -ne $ExpectedSize) { Stop-G3 "download size mismatch for ${Target}: expected $ExpectedSize, got $total" }
            if (Test-Path -LiteralPath $Target) { Stop-G3 "refusing to overwrite $Target" }
            [System.IO.File]::Move($temp, $Target)
            return
        } finally {
            if ($null -ne $output) { $output.Dispose() }
            if ($null -ne $input) { $input.Dispose() }
            if ($null -ne $response) { $response.Dispose() }
            $client.Dispose()
            $handler.Dispose()
        }
    }
    Stop-G3 "too many redirects for $UriText"
}

function Get-Sha256([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }

if (-not (Test-Path -LiteralPath $GatePath -PathType Leaf)) { Stop-G3 "G3 gate is absent" }
if (Test-Path -LiteralPath $ManifestPath) { Stop-G3 "refusing to overwrite dataset source manifest" }
$gate = Get-Content -LiteralPath $GatePath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($gate.gate_id -ne "G3" -or $gate.decision -ne "APPROVED") { Stop-G3 "G3 gate is absent or not approved" }
if ($gate.repository_id -ne $Repository -or $gate.revision_sha -ne $Revision -or $gate.configuration -ne $Configuration) { Stop-G3 "G3 source identity does not match the pinned source" }
if ($gate.license_id -ne "CC-BY-3.0") { Stop-G3 "G3 license is not CC BY 3.0" }
if ($gate.license_acceptance.accepted -ne $true -or $gate.x_twitter_terms_acceptance.accepted -ne $true) { Stop-G3 "license or current X/Twitter terms acceptance is absent" }
$requiredActions = @("validate_g3_gate", "retrieve_pinned_dataset_source", "verify_dataset_revision", "verify_dataset_file_set", "verify_dataset_lfs_identities", "verify_dataset_file_sizes", "verify_dataset_file_hashes", "make_retrieved_source_read_only", "write_dataset_source_manifest")
foreach ($action in $requiredActions) { if (@($gate.authorized_actions) -notcontains $action) { Stop-G3 "authorized action is missing: $action" } }
$expectedFiles = @($gate.expected_files)
if ($expectedFiles.Count -ne 3 -or [Int64]$gate.expected_download_bytes -ne 340595) { Stop-G3 "approved Portuguese file set or total size is unexpected" }
$expectedPaths = @($expectedFiles | ForEach-Object { $_.path })
if ((@($expectedPaths | Sort-Object) -join "|") -ne "data/portuguese/test.jsonl|data/portuguese/train.jsonl|data/portuguese/validation.jsonl") { Stop-G3 "approved file set is not exactly the Portuguese three-split source" }

$localAppData = [Environment]::GetEnvironmentVariable("LOCALAPPDATA")
if ([string]::IsNullOrWhiteSpace($localAppData)) { Stop-G3 "LOCALAPPDATA is unavailable; no fallback is allowed" }
$cachePathText = [Environment]::ExpandEnvironmentVariables(([string]$gate.cache_path).Replace("/", "\"))
$cachePath = [System.IO.Path]::GetFullPath($cachePathText)
$repoPath = [System.IO.Path]::GetFullPath($Root)
$approvedRoot = [System.IO.Path]::GetFullPath((Join-Path $localAppData "alura-llama-factory\001-resource-efficient-finetune"))
if (-not $cachePath.StartsWith($approvedRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) { Stop-G3 "cache path is outside the approved external root" }
if ($cachePath.StartsWith($repoPath + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) -or $cachePath -eq $repoPath) { Stop-G3 "cache path is inside the repository" }
$cacheParent = Split-Path -Parent $cachePath
New-Item -ItemType Directory -Path $cacheParent -Force | Out-Null
if (Test-Path -LiteralPath $cachePath -PathType Container) {
    $existingFiles = @(Get-ChildItem -LiteralPath $cachePath -Recurse -File -Force)
    foreach ($existing in $existingFiles) {
        $existingRelative = $existing.FullName.Substring($cachePath.Length + 1).Replace("\", "/")
        if ($expectedPaths -notcontains $existingRelative) { Stop-G3 "unexpected existing cache file: $($existing.FullName)" }
        $expectedExisting = @($expectedFiles | Where-Object { $_.path -eq $existingRelative })[0]
        if ([Int64]$existing.Length -ne [Int64]$expectedExisting.size_bytes) { Stop-G3 "existing cache file size mismatch: $($existing.FullName)" }
    }
} elseif (Test-Path -LiteralPath $cachePath) {
    Stop-G3 "cache path exists and is not a directory: $cachePath"
} else {
    New-Item -ItemType Directory -Path $cachePath -ErrorAction Stop | Out-Null
}

$allowedHosts = @($gate.allowed_hosts | ForEach-Object { ([string]$_).ToLowerInvariant() })
$tree = Invoke-G3GetText ([string]$gate.metadata_url) $allowedHosts | ConvertFrom-Json
$observedFiles = @($tree | Where-Object { $_.type -eq "file" })
foreach ($expected in $expectedFiles) {
    $observed = @($observedFiles | Where-Object { $_.path -eq $expected.path })
    if ($observed.Count -ne 1) { Stop-G3 "pinned tree does not contain exactly one expected file: $($expected.path)" }
    if ([Int64]$observed[0].size -ne [Int64]$expected.size_bytes -or [string]$observed[0].oid -ne [string]$expected.git_blob_oid) { Stop-G3 "revision metadata mismatch for $($expected.path)" }
    if ($null -eq $observed[0].lfs -or [string]$observed[0].lfs.oid -ne [string]$expected.lfs_oid -or [Int64]$observed[0].lfs.size -ne [Int64]$expected.size_bytes) { Stop-G3 "LFS identity mismatch for $($expected.path)" }
}

$fileManifest = @()
foreach ($expected in ($expectedFiles | Sort-Object path)) {
    $relativePath = ([string]$expected.path).Replace("/", "\")
    $target = Join-Path $cachePath $relativePath
    $targetParent = Split-Path -Parent $target
    New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
    $encodedPath = [Uri]::EscapeDataString(([string]$expected.path)).Replace("%2F", "/")
    $downloadUrl = "https://huggingface.co/datasets/$Repository/resolve/$Revision/${encodedPath}?download=true"
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
        Get-G3File $downloadUrl $target ([Int64]$expected.size_bytes) $allowedHosts
    }
    if ((Get-Item -LiteralPath $target).Length -ne [Int64]$expected.size_bytes) { Stop-G3 "file size mismatch for $target" }
    $digest = Get-Sha256 $target
    if ($digest -ne ([string]$expected.lfs_oid).ToLowerInvariant()) { Stop-G3 "SHA-256 does not match the approved LFS identity for $target" }
    $fileManifest += [ordered]@{
        path = [string]$expected.path
        size_bytes = [Int64]$expected.size_bytes
        sha256 = $digest
        git_blob_oid = [string]$expected.git_blob_oid
        lfs_oid = [string]$expected.lfs_oid
        url = $downloadUrl
    }
}

Get-ChildItem -LiteralPath $cachePath -Recurse -File | ForEach-Object { $_.IsReadOnly = $true }
Get-ChildItem -LiteralPath $cachePath -Recurse -Directory | ForEach-Object { $_.Attributes = $_.Attributes -bor [System.IO.FileAttributes]::ReadOnly }
if (@(Get-ChildItem -LiteralPath $cachePath -Recurse -File | Where-Object { -not $_.IsReadOnly }).Count -ne 0) { Stop-G3 "retrieved source could not be made read-only" }
$freeBytesAfter = [System.IO.DriveInfo]::new($cachePath.Substring(0, 3)).AvailableFreeSpace
if ($freeBytesAfter -lt [Int64]$gate.storage_policy.minimum_free_bytes_after) { Stop-G3 "approved free-space threshold was crossed" }
$retrievedBytes = [Int64]0
foreach ($file in $fileManifest) { $retrievedBytes += [Int64]$file["size_bytes"] }
$manifest = [ordered]@{
    repository_id = $Repository
    revision_sha = $Revision
    configuration = $Configuration
    license_id = [string]$gate.license_id
    approval_state = "APPROVED_RETRIEVED"
    retrieved_at = [DateTime]::UtcNow.ToString("o")
    cache_path = $cachePath
    source_format = "JSONL files as retrieved; no decoding or transformation performed"
    transformation = "NONE"
    analysis_performed = $false
    source_text_in_repository = $false
    read_only = $true
    expected_download_bytes = [Int64]$gate.expected_download_bytes
    retrieved_bytes = $retrievedBytes
    file_count = $fileManifest.Count
    file_manifest = $fileManifest
    free_bytes_after = $freeBytesAfter
}
if (Test-Path -LiteralPath $ManifestPath) { Stop-G3 "refusing to overwrite dataset source manifest" }
$manifestStream = [System.IO.File]::Open($ManifestPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
try {
    $writer = [System.IO.StreamWriter]::new($manifestStream, [System.Text.UTF8Encoding]::new($false))
    $writer.WriteLine(($manifest | ConvertTo-Json -Depth 8))
    $writer.Flush(); $writer.Dispose()
} finally { $manifestStream.Dispose() }
Write-Output $ManifestPath
