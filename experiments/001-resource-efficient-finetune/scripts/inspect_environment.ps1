[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$target = [System.IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $target) {
    throw "Refusing to overwrite environment report: $target"
}

function Invoke-ObservedCommand {
    param([string]$Command, [string[]]$Arguments)
    $resolved = Get-Command $Command -ErrorAction SilentlyContinue
    if ($null -eq $resolved) { return $null }
    try { return (& $resolved.Source @Arguments 2>&1 | Out-String).Trim() } catch { return $null }
}

$os = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object {
    $driverDate = $null
    if ($_.DriverDate -is [datetime]) {
        $driverDate = $_.DriverDate.ToUniversalTime().ToString('o')
    } elseif ($null -ne $_.DriverDate) {
        try { $driverDate = ([Management.ManagementDateTimeConverter]::ToDateTime([string]$_.DriverDate)).ToUniversalTime().ToString('o') } catch { $driverDate = [string]$_.DriverDate }
    }
    [ordered]@{
        name = $_.Name
        pnp_device_id = $_.PNPDeviceID
        driver_version = $_.DriverVersion
        driver_date = $driverDate
        adapter_ram_reported_bytes = if ($null -ne $_.AdapterRAM) { [uint64]$_.AdapterRAM } else { $null }
        memory_interpretation = 'WMI AdapterRAM is recorded as reported and is not treated as dedicated-memory proof for an integrated GPU.'
    }
})
$systemDrive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$($os.SystemDrive)'"
$pageSettings = @(Get-CimInstance Win32_PageFileSetting -ErrorAction SilentlyContinue | ForEach-Object {
    [ordered]@{ name = $_.Name; initial_size_mb = $_.InitialSize; maximum_size_mb = $_.MaximumSize }
})
$pageUsage = @(Get-CimInstance Win32_PageFileUsage -ErrorAction SilentlyContinue | ForEach-Object {
    [ordered]@{ name = $_.Name; allocated_base_mb = $_.AllocatedBaseSize; current_usage_mb = $_.CurrentUsage; peak_usage_mb = $_.PeakUsage }
})
$activePowerPlan = Invoke-ObservedCommand -Command 'powercfg.exe' -Arguments @('/GETACTIVESCHEME')
$pythonVersion = Invoke-ObservedCommand -Command 'python.exe' -Arguments @('--version')
$pythonArchitecture = Invoke-ObservedCommand -Command 'python.exe' -Arguments @('-c', 'import platform,struct; print(platform.machine()+";"+str(struct.calcsize("P")*8))')
$uvVersion = Invoke-ObservedCommand -Command 'uv.exe' -Arguments @('--version')

$profile = [ordered]@{
    profile_id = 'environment-g1-2026-08-21'
    captured_at = (Get-Date).ToUniversalTime().ToString('o')
    inspection_mode = 'READ_ONLY'
    operational_actions_performed = $false
    runtime_tested = $false
    operating_system = [ordered]@{
        caption = $os.Caption
        version = $os.Version
        build_number = $os.BuildNumber
        architecture = $os.OSArchitecture
        system_drive = $os.SystemDrive
    }
    cpu = [ordered]@{
        name = $cpu.Name
        cores = $cpu.NumberOfCores
        logical_processors = $cpu.NumberOfLogicalProcessors
    }
    gpu = $gpus
    memory = [ordered]@{
        total_physical_bytes = [uint64]$os.TotalVisibleMemorySize * 1KB
        available_physical_bytes = [uint64]$os.FreePhysicalMemory * 1KB
        total_virtual_bytes = [uint64]$os.TotalVirtualMemorySize * 1KB
        available_virtual_bytes = [uint64]$os.FreeVirtualMemory * 1KB
        pagefile_settings = $pageSettings
        pagefile_usage = $pageUsage
    }
    storage = [ordered]@{
        drive = $systemDrive.DeviceID
        size_bytes = [uint64]$systemDrive.Size
        free_bytes = [uint64]$systemDrive.FreeSpace
    }
    power = [ordered]@{
        active_plan_observation = $activePowerPlan
        observation_only = $true
    }
    python = [ordered]@{
        observed_version = $pythonVersion
        observed_architecture = $pythonArchitecture
        repository_version_request = if (Test-Path -LiteralPath '.python-version') { (Get-Content -Raw -LiteralPath '.python-version').Trim() } else { $null }
    }
    uv = [ordered]@{ observed_version = $uvVersion }
    constraints = [ordered]@{
        local_only = $true
        external_compute_cost_brl = 0
        maximum_model_parameters = 1500000000
        maximum_principal_run_minutes = 60
        silent_fallback_allowed = $false
    }
    readiness = 'OBSERVED'
    readiness_note = 'G1 is observation only. No package, XPU or LLaMA-Factory capability has been tested.'
}

$parent = Split-Path -Parent $target
if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent | Out-Null }
$profile | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $target -Encoding utf8NoBOM -NoNewline
Write-Output $target
