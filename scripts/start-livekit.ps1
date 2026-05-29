$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$livekitExe = "C:\livekit\livekit-server.exe"
$configPath = Join-Path $root "livekit.yaml"

function Get-LanIp {
  $ip = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
    Where-Object {
      $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
      $_.IPAddressToString -notlike "127.*" -and
      $_.IPAddressToString -notlike "169.254.*"
    } |
    Select-Object -First 1 |
    ForEach-Object { $_.IPAddressToString }

  if (-not $ip) {
    $ip = "localhost"
  }

  return $ip
}

if (-not (Test-Path $livekitExe)) {
  throw "LiveKit server not found at $livekitExe. Download and extract livekit-server.exe to C:\livekit first."
}

$lanIp = Get-LanIp

Write-Host ""
Write-Host "Starting LiveKit"
Write-Host "----------------"
Write-Host "LiveKit local URL:  ws://localhost:7880"
Write-Host "LiveKit LAN URL:    ws://$lanIp`:7880"
Write-Host "Config:             $configPath"
Write-Host ""

& $livekitExe --config $configPath --bind 0.0.0.0 --node-ip $lanIp
