@echo off
chcp 65001 >nul
title Detectar conexion impresora
cd /d "%~dp0"

echo.
echo === DETECTAR CONEXION (USB / RED / SERIAL) ===
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\detect-printer-connection.ps1"

echo.
pause
