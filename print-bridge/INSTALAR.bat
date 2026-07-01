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
echo.

if not exist ".env" (
  if exist ".env.example" (
    echo Creando .env desde .env.example...
    copy /Y ".env.example" ".env" >nul
    echo.
    echo IMPORTANTE: Edita .env y pon PRINTER_NAME con el nombre de la impresora en Windows.
    echo.
    notepad ".env"
  ) else (
    echo ERROR: Falta .env.example
    pause
    exit /b 1
  )
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows.ps1" -InstallDir "%~dp0"

echo.
pause
