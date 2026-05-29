$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $root "interview-opencode"

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

Write-Host ""
Write-Host "Starting frontend"
Write-Host "-----------------"
Write-Host "Frontend local URL:  http://localhost:5173"
Write-Host "Frontend LAN URL:    http://$lanIp`:5173"
Write-Host "Backend used by app: http://$lanIp`:8080 when opened from the LAN URL"
Write-Host ""

Set-Location $frontendPath
& npm.cmd run dev
