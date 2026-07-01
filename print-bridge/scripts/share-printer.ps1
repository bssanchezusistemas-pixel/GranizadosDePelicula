# Comparte la impresora configurada en .env (modo recomendado en Windows).
param(
  [string]$InstallDir = ""
)

$ErrorActionPreference = "Continue"

if ([string]::IsNullOrWhiteSpace($InstallDir)) {
  $InstallDir = Split-Path -Parent $PSScriptRoot
} else {
  $InstallDir = $InstallDir.Trim().Trim('"').TrimEnd('\')
}

$InstallDir = [System.IO.Path]::GetFullPath($InstallDir)
$envFile = Join-Path $InstallDir ".env"

if (-not (Test-Path $envFile)) {
  Write-Host "AVISO: No hay .env en $InstallDir" -ForegroundColor Yellow
  exit 0
}

$printerName = $null
$printerShare = $null
$lines = Get-Content $envFile -Encoding UTF8

foreach ($line in $lines) {
  if ($line -match '^\s*PRINTER_NAME\s*=\s*(.+)\s*$') {
    $printerName = $matches[1].Trim().Trim('"')
  }
  if ($line -match '^\s*PRINTER_SHARE\s*=\s*(.+)\s*$') {
    $printerShare = $matches[1].Trim().Trim('"')
  }
}

if (-not $printerName) {
  Write-Host "AVISO: Falta PRINTER_NAME en .env" -ForegroundColor Yellow
  exit 0
}

function Get-SafeShareName([string]$name) {
  $safe = ($name -replace '[^\w\-]', '')
  if ($safe.Length -lt 1) { return "ImpresoraCaja" }
  if ($safe.Length -gt 31) { return $safe.Substring(0, 31) }
  return $safe
}

$shareName = if ($printerShare) { $printerShare } else { Get-SafeShareName $printerName }

Write-Host "Impresora Windows: $printerName"
Write-Host "Nombre para compartir: $shareName"

try {
  $printer = Get-Printer -Name $printerName -ErrorAction Stop
  Set-Printer -Name $printer.Name -Shared $true -ShareName $shareName
  Write-Host "OK: Impresora compartida como \\localhost\$shareName" -ForegroundColor Green
} catch {
  Write-Host "No se pudo compartir automaticamente: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "Hazlo manual: Configuracion - Impresoras - $printerName - Compartir" -ForegroundColor Yellow
}

# Actualizar PRINTER_SHARE y PRINTER_MODE en .env
$newLines = @()
$hasShare = $false
$hasMode = $false

foreach ($line in $lines) {
  if ($line -match '^\s*PRINTER_SHARE\s*=') {
    $newLines += "PRINTER_SHARE=$shareName"
    $hasShare = $true
  } elseif ($line -match '^\s*PRINTER_MODE\s*=') {
    $newLines += "PRINTER_MODE=share"
    $hasMode = $true
  } else {
    $newLines += $line
  }
}

if (-not $hasShare) { $newLines += "PRINTER_SHARE=$shareName" }
if (-not $hasMode) { $newLines += "PRINTER_MODE=share" }

Set-Content -Path $envFile -Value $newLines -Encoding UTF8
Write-Host "Actualizado .env con PRINTER_SHARE=$shareName y PRINTER_MODE=share"
