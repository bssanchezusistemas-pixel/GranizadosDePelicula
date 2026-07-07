# Archivo: sistema POS completo (Granizados de Película)

Rama Git: **`archive/sistema-completo`**

Snapshot del sistema antes de simplificar el producto del cliente a **sitio web + panel de productos + registro**.

## Qué incluye esta versión

### Sitio público
- Menú con fotos (`src/data/menu.ts` estático + `public/menu/*.webp`)
- Carrito y pedido por WhatsApp

### Caja / POS (`/caja`)
- Toma de pedidos (`ProductGrid`, checkout)
- Mesas y ubicaciones (`/caja/mesas`)
- Registro de ventas (`/caja/registro`) — solo admin
- Domicilios (`/caja/domicilios`) — solo admin

### Admin (`/admin`)
- Meseros (`/admin/meseros`)
- Mesas (`/admin/mesas`)
- Login unificado con caja (`/caja/login`)

### Cocina
- Tablero de pedidos (`/cocina`)

### Impresión local
- `print-bridge/` — servicio en PC de caja (puerto 9101)
- Impresión por estación: bar (USB), cocina (red), recibos/caja
- Scripts: `PROBAR-BAR.bat`, empaquetado `npm run print:pack`

### Base de datos (Supabase)
- `meseros`, `ubicaciones`, `pedidos_caja`, `pedido_items_caja`
- `domiciliarios`, `turnos`, `pedidos_domicilio`
- `cierres_diarios`

## Cómo reutilizar

```bash
git fetch origin
git checkout archive/sistema-completo
npm install
cd print-bridge && npm install
```

Configurar `.env.local` (Supabase) y `print-bridge/.env` (impresoras). Ver `print-bridge/.env.example`.

## Rama activa simplificada

En `main` (posterior a este snapshot): menú editable en Supabase, `/admin/productos`, `/admin/registro`; sin caja POS, cocina ni domicilios en el panel del cliente.
