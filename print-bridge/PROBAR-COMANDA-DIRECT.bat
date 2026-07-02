@echo off
chcp 65001 >nul
title Probar comanda SIN servicio
cd /d "%~dp0"

if not exist ".env" (
  echo ERROR: Falta .env
  pause
  exit /b 1
)

echo.
echo === COMANDA DIRECTA (sin HTTP, mismo metodo que PROBAR-IMPRESORA) ===
echo.

set "GRANIZADOS_APP_ROOT=%~dp0"
set "NODE_PATH=%~dp0app\node_modules"
"node\node.exe" "app\dist\cli-print-comanda.js"

echo.
pause
