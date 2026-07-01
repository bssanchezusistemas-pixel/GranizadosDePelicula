# Print Bridge — Logic Controls LR1100U

Servicio local que recibe comandas desde `/caja` (Vercel) e imprime en la impresora térmica ESC/POS por USB.

## PC de caja (recomendado — sin instalar Node)

En el PC del restaurante **no hace falta** copiar todo el proyecto. Solo la carpeta empaquetada.

### Generar el paquete (desarrollo, una vez)

Desde la raíz del repo:

```bash
npm run print:pack
```

Se crea `print-bridge/release/GranizadosImpresora/` lista para copiar (USB, red, etc.).

### Instalar en el PC de caja

1. Copia la carpeta `GranizadosImpresora` al PC (ej. `C:\GranizadosImpresora`).
2. Doble clic en **`INSTALAR.bat`**.
3. Edita `.env` cuando se abra el bloc de notas:
   - `PRINTER_NAME` = nombre exacto en Windows
   - `ALLOWED_ORIGINS` = URL de Vercel (ej. `https://tu-app.vercel.app`)
4. Listo: quedan acceso directo en el **Escritorio** e **inicio automático** al encender Windows.

### Uso diario

- Al prender el PC, el servicio arranca solo (ventana negra — no cerrar).
- O doble clic en **Granizados Impresora** del escritorio.
- Abre el navegador → URL de Vercel → `/caja`.
- Indicador verde = impresora lista.

Contenido del paquete: `GranizadosImpresora.exe`, `Iniciar.bat`, Node portable, servidor. Ver `LEEME-CAJA.txt`.

---

## Desarrollo (con Node en tu máquina)

### Requisitos

- Windows 10/11
- Node.js 18+
- Impresora LR1100U con driver instalado
- Rollo térmico 80 mm

### Instalación

```bash
cd print-bridge
npm install
copy .env.example .env
```

Edita `.env`:

```
PRINTER_NAME=LR1100
ALLOWED_ORIGINS=http://localhost:3000,https://tu-dominio.vercel.app
```

Prueba:

```bash
npm run test
```

### Servidor en desarrollo

```bash
npm run print:bridge
```

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |
| POST | `/print` | Body: `{ "ticket": { ... } }` |

Solo escucha en `127.0.0.1:9101` (localhost).

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| **No driver set** / error de driver | Ejecuta `npm install` en print-bridge (incluye el paquete `printer`) y reinicia el servicio |
| No se pudo conectar | USB, encendido, driver, nombre en `PRINTER_NAME` (debe ser idéntico al de Windows) |
| Lista impresoras | `npm run printers --prefix print-bridge` |
| Verde servicio pero no imprime | El indicador ahora distingue servicio vs impresora; revisa `PRINTER_NAME` |
| Caracteres raros (ñ, tildes) | Driver Logic Controls; code page PC858 |
| Caja dice “impresora offline” | Ventana del servicio abierta o reiniciar acceso directo |
| Origen no permitido (CORS) | Agregar URL de Vercel a `ALLOWED_ORIGINS` |

## Cajón monedero (RJ11)

Fase futura: pulso ESC/POS al confirmar pago en efectivo.
