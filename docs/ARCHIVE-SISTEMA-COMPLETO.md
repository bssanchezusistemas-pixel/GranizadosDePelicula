# Archivo: sistema POS completo

Rama **`archive/sistema-completo`** en GitHub conserva el snapshot funcional del sistema antes de simplificar a sitio web + admin de productos + registro.

## Qué incluye esa rama

- Caja POS (`/caja`) con carrito, cobro y meseros
- Mesas (`/caja/mesas`, `/admin/mesas`)
- Cocina (`/cocina`)
- Domicilios (`/caja/domicilios`, `/admin/domicilios`)
- Print-bridge multi-estación (comandas por barra/cocina)
- Registro de ventas y cierre diario
- Menú estático en `src/data/menu.ts`

## Cómo recuperarlo

```bash
git fetch origin
git checkout archive/sistema-completo
```

Para volver al producto simplificado:

```bash
git checkout main
```

## Producto activo (main)

- Sitio público con menú editable en Supabase
- `/admin/productos` — CRUD de productos
- `/admin/registro` — historial de ventas (sin nuevos pedidos desde caja)

Las rutas legacy redirigen a `/admin/productos`. Para volver a operar caja, usar la rama archive o reactivar rutas desde ese snapshot.
