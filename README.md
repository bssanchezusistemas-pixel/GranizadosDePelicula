# Granizados de Película

Landing premium inmersiva para comida rápida en Zarzal, Valle del Cauca. Estilo cinematográfico (negro + neón rojo), animación de hamburguesa al scroll, menú demo, carrito vía WhatsApp.

## Requisitos

- Node.js 18+
- npm

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Prueba el scroll en móvil (DevTools → responsive).

## Deploy en Vercel

1. Sube el proyecto a GitHub (o conecta la carpeta).
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. Framework: **Next.js** (detectado automáticamente).
4. Deploy. No requiere variables de entorno para la demo.

> **Nota:** La carpeta `public/animacion/` tiene ~240 frames (~50 MB). El primer deploy puede tardar un poco más.

## Assets del hero

| Archivo | Ubicación | Uso |
|---------|-----------|-----|
| Frames burger | `public/animacion/00001_resultado.webp` … `00240_resultado.webp` | Secuencia al scroll (GSAP + canvas) |
| Fondo | `public/hero-bg.jpeg` | Background del hero |
| Video (reserva) | `public/hero-burger.mp4` | No usado aún; disponible como fallback |

### Añadir o reemplazar frames

1. Coloca archivos en `public/animacion/` con el patrón `NNNNN_resultado.webp` (5 dígitos, empezando en `00001`).
2. Actualiza `TOTAL_SOURCE_FRAMES` en `src/data/heroFrames.ts` si cambia la cantidad.
3. Para menos peso en móvil, sube el `step` en `getFrameStep()` (más step = menos frames cargados).

## Menú y datos del negocio

Edita `src/data/menu.ts`:

- Precios, nombres y categorías (`MENU_CATEGORIES`)
- WhatsApp, dirección, horarios (`BUSINESS`)

## Panel de domicilios (Supabase)

Ruta: `/admin/domicilios` (requiere login en `/admin/login`).

### 1. Variables de entorno

Copia `.env.local.example` → `.env.local` (ya configurado en local si trabajas en esta máquina).

En **Vercel** agrega las mismas variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. SQL en Supabase

En [Supabase SQL Editor](https://supabase.com/dashboard/project/xhyqpeitlshgctvwwzch/sql/new):

1. `sql/001_create_tables.sql` — tablas (si aún no las corriste)
2. `sql/002_rls_policies.sql` — **obligatorio** para que el panel lea/escriba datos

### 3. Crear usuario admin

Supabase → **Authentication** → **Users** → **Add user**:

- Email y contraseña de tu elección
- Marca **Auto Confirm User**

Luego entra en `http://localhost:3000/admin/login`.

### Estado actual del proyecto Supabase

| Tabla | Filas | RLS |
|-------|-------|-----|
| `domiciliarios` | 2 (Pedro, Luis) | activo |
| `turnos` | 0 | activo |
| `pedidos_domicilio` | 0 | activo |

Usuarios Auth: créalo tú en el dashboard (el MCP está en modo solo lectura).

## Stack

- Next.js 15 · React 19 · Tailwind CSS 4 · GSAP ScrollTrigger · Supabase
