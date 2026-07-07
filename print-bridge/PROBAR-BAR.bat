@echo off
chcp 65001 >nul
title Probar impresora BAR (USB)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$body = @{ ticket = @{ numeroPedido = 9991; hora = 'prueba'; destino = 'Bar'; formaPago = 'Efectivo'; items = @(@{ cantidad = 1; nombre = 'Granizado Oreo'; precioLinea = 11000 }); subtotal = 11000; total = 11000; station = 'bar'; kind = 'comanda' }; station = 'bar'; kind = 'comanda'; copies = 1 } | ConvertTo-Json -Depth 6; try { Invoke-RestMethod -Uri 'http://127.0.0.1:9101/print' -Method POST -Body $body -ContentType 'application/json' | Out-Null; Write-Host 'OK: comanda BAR enviada' -ForegroundColor Green } catch { Write-Host 'ERROR:' $_.Exception.Message -ForegroundColor Red }"
pause
