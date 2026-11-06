$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$RepoRoot = Split-Path $PSScriptRoot -Parent
function Invoke-Checked {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Fallo ($LASTEXITCODE): $Executable" }
}
function Find-SdkTool {
    param([string]$Name, [string]$TizenRoot)
    $found = Get-Command $Name -ErrorAction SilentlyContinue
    if ($found) { return $found.Source }
    $roots = @($TizenRoot, 'C:\tizen-studio', (Join-Path $env:USERPROFILE 'tizen-studio')) | Where-Object { $_ }
    foreach ($root in $roots) {
        $relative = if ($Name -eq 'sdb.exe') { 'tools\sdb.exe' } else { 'tools\ide\bin\tizen.bat' }
        $candidate = Join-Path $root $relative
        if (Test-Path $candidate) { return $candidate }
    }
    throw "No se encontro $Name. Instala Tizen Studio y Samsung TV Extension; consulta docs\INSTALAR-WINDOWS.md."
}
function Get-PcAddress {
    $route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Sort-Object RouteMetric | Select-Object -First 1
    if (-not $route) { throw 'No hay ruta de red activa.' }
    $address = Get-NetIPAddress -InterfaceIndex $route.InterfaceIndex -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1
    if (-not $address) { throw 'No se encontro la IPv4 del PC. Usa -PcIp.' }
    return $address.IPAddress
}
