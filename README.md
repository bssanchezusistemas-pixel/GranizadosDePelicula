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

## Stack

- Next.js 15 · React 19 · Tailwind CSS 4 · GSAP ScrollTrigger
