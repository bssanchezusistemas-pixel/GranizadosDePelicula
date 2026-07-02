# Muestra como esta conectada la impresora en Windows y sugiere .env
param(
  [string]$PrinterName = ""
)

$ErrorActionPreference = "Continue"
$envFile = Join-Path $PSScriptRoot ".." ".env"
if (-not (Test-Path $envFile)) { $envFile = Join-Path $PSScriptRoot ".." ".env.example" }

if (-not $PrinterName -and (Test-Path $envFile)) {
  $line = Get-Content $envFile | Where-Object { $_ -match '^\s*PRINTER_NAME\s*=' } | Select-Object -First 1
  if ($line -match '=\s*(.+)') { $PrinterName = $matches[1].Trim().Trim('"') }
}

Write-Host ""
Write-Host "=== IMPRESORAS EN ESTE PC ===" -ForegroundColor Cyan
Get-Printer | Format-Table Name, PortName, DriverName, PrinterStatus, Shared -AutoSize

Write-Host "=== PUERTOS ===" -ForegroundColor Cyan
Get-PrinterPort | Format-Table Name, Description, PrinterHostAddress -AutoSize

if (-not $PrinterName) {
  Write-Host ""
  Write-Host "Indica el nombre en .env (PRINTER_NAME=...) y vuelve a ejecutar." -ForegroundColor Yellow
  exit 0
}

$p = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
if (-not $p) {
  Write-Host "No encontre impresora: $PrinterName" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== DETALLE: $PrinterName ===" -ForegroundColor Green
Write-Host "Puerto Windows: $($p.PortName)"
Write-Host "Driver: $($p.DriverName)"
Write-Host "Estado: $($p.PrinterStatus)"

$port = Get-PrinterPort -Name $p.PortName -ErrorAction SilentlyContinue
$ip = $null
if ($port -and $port.PrinterHostAddress) { $ip = $port.PrinterHostAddress }
if (-not $ip -and $p.PortName -match 'IP[_-]?([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)') { $ip = $matches[1] }

Write-Host ""
if ($ip) {
  Write-Host "CONEXION: RED (Ethernet/WiFi) — IP $ip" -ForegroundColor Green
  Write-Host "Prueba puerto 9100..."
  $tcp = Test-NetConnection -ComputerName $ip -Port 9100 -WarningAction SilentlyContinue
  if ($tcp.TcpTestSucceeded) {
    Write-Host "Puerto 9100: ABIERTO (impresora lista para recibir tickets)" -ForegroundColor Green
  } else {
    Write-Host "Puerto 9100: cerrado o sin respuesta. Revisa cable de red." -ForegroundColor Red
  }
  Write-Host ""
  Write-Host "Pon esto en .env:" -ForegroundColor Yellow
  Write-Host "PRINTER_MODE=tcp"
  Write-Host "PRINTER_HOST=$ip"
  Write-Host "PRINTER_PORT=9100"
  Write-Host "PRINTER_NAME=$PrinterName"
} elseif ($p.PortName -match '^COM\d') {
  Write-Host "CONEXION: SERIAL ($($p.PortName)) — cable redondo/largo" -ForegroundColor Yellow
  Write-Host "No es USB ni Ethernet directo. Puede ir a un adaptador o caja registradora."
  Write-Host "Opcion A: configurar impresora con IP en el panel de la impresora y usar modo tcp."
  Write-Host "Opcion B: compartir impresora desde otro PC que si la controle."
} elseif ($p.PortName -match 'USB') {
  Write-Host "CONEXION: USB ($($p.PortName))" -ForegroundColor Yellow
  Write-Host "Si el cable fisico NO es USB, Windows puede estar apuntando al puerto equivocado."
  Write-Host "Ejecuta PROBAR-RED.bat si la impresora tiene Ethernet."
  Write-Host ""
  Write-Host "Prueba en .env:" -ForegroundColor Yellow
  Write-Host "PRINTER_MODE=auto"
  Write-Host "PRINTER_NAME=$PrinterName"
} else {
  Write-Host "Puerto: $($p.PortName) — revisa cable fisico (Ethernet vs USB vs serial)."
}

Write-Host ""
