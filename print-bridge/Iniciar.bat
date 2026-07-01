@echo off
chcp 65001 >nul
title Granizados - Impresora
cd /d "%~dp0"

if not exist ".env" (
  echo.
  echo ERROR: Falta .env en esta carpeta.
  echo Copia .env.example a .env y configura PRINTER_NAME.
  echo.
  pause
  exit /b 1
)

if not exist "node\node.exe" (
  echo ERROR: Falta node\node.exe — carpeta incompleta.
  pause
  exit /b 1
)

echo ========================================
echo   GRANIZADOS DE PELICULA — IMPRESORA
echo ========================================
echo Servicio activo. NO cierre esta ventana.
echo.

set GRANIZADOS_APP_ROOT=%~dp0
"node\node.exe" "app\dist\server.js"

echo.
echo Servicio detenido.
pause
