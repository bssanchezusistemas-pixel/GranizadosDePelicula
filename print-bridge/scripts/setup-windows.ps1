# Crea acceso directo en Escritorio e inicio automático al encender Windows.
param(
  [string]$InstallDir = $PSScriptRoot
)

$ErrorActionPreference = "Stop"
$InstallDir = (Resolve-Path $InstallDir).Path.TrimEnd("\")

$exePath = Join-Path $InstallDir "GranizadosImpresora.exe"
$batPath = Join-Path $InstallDir "Iniciar.bat"
$cmdExe = Join-Path $env:SystemRoot "System32\cmd.exe"

$target = $null
$arguments = $null

if (Test-Path $exePath) {
  $target = $exePath
} elseif (Test-Path $batPath) {
  $target = $cmdExe
  $arguments = "/c `"$batPath`""
} else {
  Write-Host "ERROR: No se encontró GranizadosImpresora.exe ni Iniciar.bat en $InstallDir" -ForegroundColor Red
  exit 1
}

$WshShell = New-Object -ComObject WScript.Shell

function New-Shortcut($lnkPath) {
  $lnk = $WshShell.CreateShortcut($lnkPath)
  $lnk.TargetPath = $target
  if ($arguments) { $lnk.Arguments = $arguments }
  $lnk.WorkingDirectory = $InstallDir
  $lnk.Description = "Servicio de impresión para caja Granizados de Película"
  $lnk.Save()
}

$desktop = [Environment]::GetFolderPath("Desktop")
$desktopLnk = Join-Path $desktop "Granizados Impresora.lnk"
New-Shortcut $desktopLnk

$startup = [Environment]::GetFolderPath("Startup")
$startupLnk = Join-Path $startup "Granizados Impresora.lnk"
New-Shortcut $startupLnk

Write-Host ""
Write-Host "Listo!" -ForegroundColor Green
Write-Host "  Escritorio: $desktopLnk"
Write-Host "  Inicio Windows: $startupLnk"
Write-Host ""
Write-Host "Al encender el PC, el servicio de impresión arrancará solo."
Write-Host "Abre la caja en el navegador con la URL de Vercel (/caja)."
