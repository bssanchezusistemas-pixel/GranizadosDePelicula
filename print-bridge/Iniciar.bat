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

REM winspool (recomendado) no usa el paquete npm "printer"
findstr /I /B "PRINTER_MODE=native" .env >nul 2>&1
if %errorlevel%==0 if not exist "app\node_modules\printer" (
  echo.
  echo AVISO: Modo native requiere INSTALAR.bat en esta carpeta.
  echo.
) else (
  findstr /I /B "PRINTER_MODE=npm" .env >nul 2>&1
  if %errorlevel%==0 if not exist "app\node_modules\printer" (
    echo.
    echo AVISO: Modo native requiere INSTALAR.bat en esta carpeta.
    echo.
  )
)

echo ========================================
echo   GRANIZADOS DE PELICULA — IMPRESORA
echo ========================================
echo Servicio activo. NO cierre esta ventana.
echo.

set "GRANIZADOS_APP_ROOT=%~dp0"
set "NODE_PATH=%~dp0app\node_modules"
"node\node.exe" "app\dist\server.js"

echo.
echo Servicio detenido.
pause
