@echo off
chcp 65001 >nul
title Probar comanda completa
cd /d "%~dp0"

echo.
echo === PROBAR COMANDA (POST /print) ===
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$body = @{ ticket = @{ numeroPedido = 9998; hora = 'prueba'; destino = 'Mesa prueba'; formaPago = 'Efectivo'; items = @(@{ cantidad = 1; nombre = 'Granizado Oreo'; precioLinea = 11000 }); subtotal = 11000; total = 11000 }; copies = 1 } | ConvertTo-Json -Depth 5;" ^
  "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:9101/print' -Method POST -Body $body -ContentType 'application/json'; Write-Host 'OK:' ($r | ConvertTo-Json) -ForegroundColor Green } catch { Write-Host 'ERROR:' $_.Exception.Message -ForegroundColor Red; if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message } }"

echo.
echo Si esto imprime pero /caja no, el problema es el navegador (CORS / red local).
echo.
pause
