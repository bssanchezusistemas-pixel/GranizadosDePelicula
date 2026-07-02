@echo off
chcp 65001 >nul
title Cola de impresion
cd /d "%~dp0"

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /i "^PRINTER_NAME=" .env 2^>nul`) do set PRINTER_NAME=%%B
set PRINTER_NAME=%PRINTER_NAME:"=%

if "%PRINTER_NAME%"=="" (
  echo Falta PRINTER_NAME en .env
  pause
  exit /b 1
)

echo Impresora: %PRINTER_NAME%
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$n='%PRINTER_NAME%'; $p=Get-Printer -Name $n -ErrorAction SilentlyContinue; if(-not $p){Write-Host 'No encontrada' -ForegroundColor Red; exit 1}; Write-Host ('Estado: ' + $p.PrinterStatus); Write-Host ('Puerto: ' + $p.PortName); Write-Host ''; $jobs=Get-PrintJob -PrinterName $n -ErrorAction SilentlyContinue; if($jobs){$jobs|Format-Table Id,DocumentName,JobStatus,TotalPages,Size -AutoSize}else{Write-Host 'Cola vacia (sin trabajos pendientes).' -ForegroundColor Green}"

echo.
pause
