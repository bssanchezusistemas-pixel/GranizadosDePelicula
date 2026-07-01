@echo off
chcp 65001 >nul
title Corregir .env impresora
cd /d "%~dp0"

if not exist ".env" (
  echo ERROR: Falta .env — ejecuta INSTALAR.bat primero.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p = Join-Path (Get-Location) '.env';" ^
  "$lines = Get-Content $p -Encoding UTF8;" ^
  "$out = @(); $hasMode = $false;" ^
  "foreach ($line in $lines) {" ^
  "  if ($line -match '^\s*PRINTER_MODE\s*=') { $out += 'PRINTER_MODE=winspool'; $hasMode = $true }" ^
  "  elseif ($line -match '^\s*PRINTER_INTERFACE\s*=') { }" ^
  "  else { $out += $line }" ^
  "};" ^
  "if (-not $hasMode) { $out += 'PRINTER_MODE=winspool' };" ^
  "[IO.File]::WriteAllLines($p, $out, [Text.UTF8Encoding]::new($false));" ^
  "Write-Host 'OK: .env actualizado a PRINTER_MODE=winspool' -ForegroundColor Green"

echo.
echo Reinicia Iniciar.bat y prueba de nuevo en /caja
echo.
pause
