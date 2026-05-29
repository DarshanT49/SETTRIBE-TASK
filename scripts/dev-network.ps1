$ErrorActionPreference = "Stop"

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
Write-Host "SetTribe network URLs"
Write-Host "---------------------"
Write-Host "Frontend: http://$lanIp`:5173"
Write-Host "Backend:  http://$lanIp`:8080"
Write-Host "LiveKit:  ws://$lanIp`:7880"
Write-Host ""
Write-Host "Use the frontend URL above from other devices on the same Wi-Fi/LAN."
Write-Host ""
