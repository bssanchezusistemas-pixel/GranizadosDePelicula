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

echo Impresoras en Windows:
powershell -NoProfile -Command "Get-Printer | Select-Object Name, Shared, ShareName, PrinterStatus | Format-Table -AutoSize"
echo.

if exist "app\node_modules\printer" (
  echo [OK] Carpeta app\node_modules\printer existe
) else (
  echo [AVISO] No hay app\node_modules\printer - normal si usas PRINTER_MODE=share
)
echo.

echo Probando servicio /health ...
powershell -NoProfile -Command "try { $r = Invoke-RestMethod http://127.0.0.1:9101/health; $r | ConvertTo-Json } catch { Write-Host 'Servicio no responde. Abre Iniciar.bat primero.' -ForegroundColor Red }"
echo.
pause
