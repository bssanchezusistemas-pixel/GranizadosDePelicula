@echo off
chcp 65001 >nul
title Probar impresora por RED
cd /d "%~dp0"

if not exist ".env" (
  echo ERROR: Falta .env — ejecuta DETECTAR-CONEXION.bat primero
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /i "^PRINTER_HOST=" .env`) do set PRINTER_HOST=%%B
set PRINTER_HOST=%PRINTER_HOST:"=%

if "%PRINTER_HOST%"=="" (
  echo.
  echo Falta PRINTER_HOST en .env
  echo.
  echo 1. Ejecuta DETECTAR-CONEXION.bat
  echo 2. Si dice IP, agrega en .env:
  echo    PRINTER_MODE=tcp
  echo    PRINTER_HOST=192.168.x.x
  echo    PRINTER_PORT=9100
  echo.
  pause
  exit /b 1
)

echo.
echo === PROBAR RED: %PRINTER_HOST%:9100 ===
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ip='%PRINTER_HOST%'; Write-Host 'Probando conexion...'; $t=Test-NetConnection $ip -Port 9100 -WarningAction SilentlyContinue; if(-not $t.TcpTestSucceeded){Write-Host 'ERROR: puerto 9100 no responde' -ForegroundColor Red; exit 1}; Write-Host 'Puerto OK. Enviando ticket de prueba...' -ForegroundColor Green; $b=[byte[]](27,64,27,97,1,71,82,65,78,73,90,65,68,79,83,32,82,69,68,10,10,27,100,3); $c=New-Object System.Net.Sockets.TcpClient; $c.Connect($ip,9100); $s=$c.GetStream(); $s.Write($b,0,$b.Length); $s.Close(); $c.Close(); Write-Host 'OK: bytes enviados por Ethernet. Debe salir papel.' -ForegroundColor Green"

echo.
pause
