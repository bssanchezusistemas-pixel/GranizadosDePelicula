@echo off
chcp 65001 >nul
title Probar impresora
cd /d "%~dp0"

if not exist ".env" (
  echo ERROR: Falta .env
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /i "^PRINTER_NAME=" .env`) do set PRINTER_NAME=%%B
set PRINTER_NAME=%PRINTER_NAME:"=%

if "%PRINTER_NAME%"=="" (
  echo ERROR: Falta PRINTER_NAME en .env
  pause
  exit /b 1
)

echo Imprimiendo ticket de prueba en: %PRINTER_NAME%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = [byte[]](27,64,27,97,1,72,79,76,65,32,71,82,65,78,73,90,65,68,79,83,10,10,27,100,2); $f = Join-Path $env:TEMP ('granizados-test-' + [guid]::NewGuid().ToString('n') + '.bin'); [IO.File]::WriteAllBytes($f, $b); & '%~dp0scripts\raw-print.ps1' -PrinterName '%PRINTER_NAME%' -FilePath $f; Remove-Item $f -Force"

echo.
pause
