@echo off
chcp 65001 >nul
title Instalar Granizados Impresora
cd /d "%~dp0"

echo.
echo ========================================
echo   INSTALAR IMPRESORA — GRANIZADOS
echo ========================================
echo.
echo Esto creara:
echo   - Acceso directo en el Escritorio
echo   - Inicio automatico al encender Windows
echo   - Compartir impresora (modo recomendado)
echo.

if not exist ".env" (
  if exist ".env.example" (
    echo Creando .env desde .env.example...
    copy /Y ".env.example" ".env" >nul
    echo.
    echo IMPORTANTE: Edita .env y pon PRINTER_NAME con el nombre exacto de la impresora.
    echo.
    notepad ".env"
  ) else (
    echo ERROR: Falta .env.example
    pause
    exit /b 1
  )
)

if not exist "node\node.exe" (
  echo ERROR: Falta node\node.exe — carpeta incompleta.
  pause
  exit /b 1
)

if not exist "app\package.json" (
  echo ERROR: Falta app\package.json — carpeta incompleta.
  pause
  exit /b 1
)

echo Instalando dependencias del servicio...
pushd "app"
call "..\node\npm.cmd" install --omit=dev --legacy-peer-deps
if errorlevel 1 (
  echo.
  echo ERROR: No se pudieron instalar dependencias. Revisa internet.
  popd
  pause
  exit /b 1
)
popd
echo.

set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

echo Compartiendo impresora en Windows...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\share-printer.ps1" -InstallDir "%INSTALL_DIR%"
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows.ps1" -InstallDir "%INSTALL_DIR%"

echo.
pause
