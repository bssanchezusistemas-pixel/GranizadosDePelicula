@echo off
chcp 65001 >nul
title Diagnostico impresora
cd /d "%~dp0"

echo.
echo === DIAGNOSTICO GRANIZADOS IMPRESORA ===
echo.

if not exist ".env" (
  echo ERROR: Falta .env
  pause
  exit /b 1
)

echo Contenido de .env:
findstr /i "PRINTER PORT ALLOWED" .env
echo.

findstr /i "PRINTER_MODE=share" .env >nul 2>&1
if %errorlevel%==0 (
  echo [AVISO] Tienes PRINTER_MODE=share — en este PC no funciona.
  echo         Ejecuta CORREGIR-ENV.bat o cambia a PRINTER_MODE=winspool
  echo.
)

echo Impresoras en Windows:
powershell -NoProfile -Command "Get-Printer | Select-Object Name, Shared, ShareName, PrinterStatus | Format-Table -AutoSize"
echo.

if exist "scripts\raw-print.ps1" (
  echo [OK] Script raw-print.ps1 presente
) else (
  echo [ERROR] Falta scripts\raw-print.ps1 — actualiza la carpeta GranizadosImpresora
)
echo.

echo Probando servicio /health ...
powershell -NoProfile -Command "try { $r = Invoke-RestMethod http://127.0.0.1:9101/health; $r | ConvertTo-Json; if ($r.printerReady -ne $true) { Write-Host ''; Write-Host 'AVISO: printerReady=false' -ForegroundColor Red } else { Write-Host ''; Write-Host 'Siguiente: ejecuta PROBAR-COMANDA.bat o abre http://127.0.0.1:9101/print/test' -ForegroundColor Cyan } } catch { Write-Host 'Servicio no responde. Abre Iniciar.bat primero.' -ForegroundColor Red }"
echo.
pause
