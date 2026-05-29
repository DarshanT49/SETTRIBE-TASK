$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $root "backend"

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

$lanIp = Get-LanIp
$env:LIVEKIT_URL = "ws://$lanIp`:7880"

Write-Host ""
Write-Host "Starting backend"
Write-Host "----------------"
Write-Host "Backend local URL:  http://localhost:8080"
Write-Host "Backend LAN URL:    http://$lanIp`:8080"
Write-Host "LIVEKIT_URL:        $env:LIVEKIT_URL"
Write-Host ""

Set-Location $backendPath
& .\mvnw.cmd spring-boot:run
