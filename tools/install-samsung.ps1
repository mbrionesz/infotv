param([string]$TvIp, [string]$Profile, [string]$TizenRoot, [string]$PcIp, [int]$Port = 8910)
. "$PSScriptRoot\common.ps1"
try {
    if (-not $TvIp) { $TvIp = Read-Host 'IPv4 del televisor Samsung' }
    if (-not $Profile) { $Profile = Read-Host 'Nombre del perfil de certificados Samsung (Certificate Manager)' }
    $address = [System.Net.IPAddress]::Parse($TvIp)
    if ($address.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { throw 'Usa IPv4 para la TV.' }
    if (-not $Profile) { throw 'Se necesita un perfil de firma Samsung con el DUID de esta TV.' }
    $sdb = Find-SdkTool 'sdb.exe' $TizenRoot
    $tizen = Find-SdkTool 'tizen.bat' $TizenRoot
    if (-not $PcIp) { $PcIp = Get-PcAddress }
    [void][System.Net.IPAddress]::Parse($PcIp)
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Instala Node.js 22 o superior.' }
    Set-Location $RepoRoot
    # Generate/reuse pairing metadata through the same code as the service.
    Invoke-Checked 'node' @('--input-type=module', '-e', "import { pairingToken } from './companion/server.mjs'; pairingToken();")
    $token = (Get-Content (Join-Path $RepoRoot '.local\pairing.json') -Raw | ConvertFrom-Json).token
    $ping = Invoke-RestMethod -Uri "http://${PcIp}:$Port/$token/rpc/ping" -TimeoutSec 8
    if (-not $ping.returnValue -or $ping.service -ne 'infotv-companion') { throw 'Inicia primero INICIAR-SERVICIO.bat.' }
    $serial = "${TvIp}:26101"
    Invoke-Checked $sdb @('connect', $serial)
    $devices = & $sdb devices
    if ($LASTEXITCODE -ne 0 -or -not ($devices -match "^$([regex]::Escape($serial))\s+device\s")) {
        throw 'TV no autorizada. Revisa Developer Mode, IP del PC, reinicio y red local.'
    }
    $stage = Join-Path $RepoRoot '.local\tizen-app'
    if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
    New-Item $stage -ItemType Directory -Force | Out-Null
    Copy-Item (Join-Path $RepoRoot 'app\*') $stage -Recurse
    $connection = @{url="http://${PcIp}:$Port";token=$token} | ConvertTo-Json -Compress
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Join-Path $stage 'config\connection.js'), "window.INFOTV_CONNECTION=$connection;", $utf8)
    Invoke-Checked $tizen @('build-web', '--', $stage)
    $build = Join-Path $stage '.buildResult'
    Invoke-Checked $tizen @('package', '-t', 'wgt', '-s', $Profile, '--', $build)
    $wgt = Get-ChildItem $build -Filter '*.wgt' | Select-Object -First 1
    if (-not $wgt) { throw 'El SDK no genero el WGT firmado.' }
    $dist = Join-Path $RepoRoot 'dist'
    New-Item $dist -ItemType Directory -Force | Out-Null
    $signed = Join-Path $dist 'InfoTV-Samsung-SIGNED.wgt'
    Copy-Item $wgt.FullName $signed -Force
    Invoke-Checked $tizen @('install', '-s', $serial, '-n', (Split-Path $signed -Leaf), '--', $dist)
    Invoke-Checked $tizen @('run', '-s', $serial, '-p', 'Infotv2026.InfoTV')
    Write-Host 'Instalacion completada. Conserva abierto el servicio en Windows.' -ForegroundColor Green
} catch { Write-Host $_ -ForegroundColor Red; exit 1 }
