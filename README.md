# Pay Alert — Frontend

Landing page y dashboard web para [Pay Alert](https://pay-alert.com.ar): plataforma SaaS
que centraliza notificaciones de pagos de Mercado Pago en tiempo real.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Deploy: Render

## Setup local

```bash
cp .env.example .env.local
# completar NEXT_PUBLIC_API_URL con la URL del backend

npm install
npm run dev   # http://localhost:3000
```

El backend debe estar corriendo en `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`).
Ver `pay-alert-api/` para levantarlo.

## Setup con Docker (stack completo)

```bash
cd ../pay-alert-api
docker-compose --env-file .env.docker up --build
```

Levanta Postgres, Redis, API, Worker y este FE juntos.
Ver `pay-alert-api/docker-compose.yml` para detalles.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend (build-time) | `http://localhost:3001` |

En producción (Render), configurar `NEXT_PUBLIC_API_URL` como env var de **build**,
no de runtime.

## Estructura relevante

```
src/
├── app/
│   ├── (auth)/          # login, register
│   └── (dashboard)/     # páginas protegidas
├── components/layout/
│   ├── DashboardShell.tsx  # fetcha rol del usuario, pasa al Sidebar
│   └── Sidebar.tsx         # filtrado por rol y existencia de página
├── lib/
│   ├── api.ts           # cliente HTTP con refresh automático
│   └── auth.ts          # token en memoria, pa_session cookie
└── proxy.ts             # middleware de rutas (Next.js 16: proxy.ts, no middleware.ts)
```

## Agregar una nueva página al dashboard

1. Crear `src/app/(dashboard)/mi-ruta/page.tsx`
2. En `src/components/layout/Sidebar.tsx` → `NAV_ITEMS` → cambiar `exists: false` a `exists: true`
3. Verificar que `roles` incluya los roles correctos

## Estructura relevante — íconos y OG image

No hay assets estáticos PNG/ICO. Todos los íconos se generan dinámicamente:

| Archivo | Propósito |
|---------|-----------|
| `src/app/icon.tsx` | Ícono del tab, PWA, share sheet (512×512, edge runtime) |
| `src/app/apple-icon.tsx` | Apple touch icon para iOS (180×180) |
| `src/app/opengraph-image.tsx` | OG/Twitter card (1200×630) |
| `src/app/manifest.ts` | PWA manifest (íconos apuntan a `/icon`) |

El manifest requiere un ícono con `purpose: 'any'` para que Chrome muestre el botón
de instalación. Ver `AGENTS.md` para más detalles.

## Deploy en Render

Render necesita `NEXT_PUBLIC_API_URL` como variable de entorno de build (no runtime).
El backend necesita la URL del FE en su variable `ALLOWED_ORIGINS`.
