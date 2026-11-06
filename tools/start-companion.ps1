param([string]$PcIp, [int]$Port = 8910, [switch]$ConfigureFirewall)
. "$PSScriptRoot\common.ps1"
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Instala Node.js LTS 22 o superior desde nodejs.org.' }
    $major = [int]((& node --version).TrimStart('v').Split('.')[0])
    if ($major -lt 22) { throw 'Se necesita Node.js 22 o superior.' }
    if (-not $PcIp) { $PcIp = Get-PcAddress }
    $ip = [System.Net.IPAddress]::Parse($PcIp)
    if ($ip.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { throw 'Usa IPv4.' }
    if ($Port -lt 1024 -or $Port -gt 65535) { throw 'Puerto invalido.' }
    if ($ConfigureFirewall) {
        $name = "InfoTV Companion TCP $Port"
        if (-not (Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue)) {
            New-NetFirewallRule -DisplayName $name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Private -RemoteAddress LocalSubnet | Out-Null
        }
    }
    if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue) -and -not $env:INFOTV_FFMPEG) {
        Write-Warning 'FFmpeg no esta disponible. El Modo Fluido no funcionara; la reproduccion Normal sigue disponible.'
    }
    $env:INFOTV_BIND = $PcIp
    $env:INFOTV_PUBLIC_URL = "http://${PcIp}:$Port"
    $env:INFOTV_PORT = "$Port"
    Set-Location $RepoRoot
    Invoke-Checked 'node' @('companion/server.mjs')
} catch { Write-Host $_ -ForegroundColor Red; exit 1 }
