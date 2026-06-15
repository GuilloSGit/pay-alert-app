<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (16.x) has breaking changes — APIs, conventions, and file structure differ
from training data. Read the relevant guide in `node_modules/next/dist/docs/` before
writing any code. Heed deprecation notices.

## Gotchas confirmados en este proyecto

### Middleware → `proxy.ts`, no `middleware.ts`
Next.js 16 renombró el archivo de middleware de ruta. El archivo correcto es
`src/proxy.ts` y exporta una función llamada `proxy` (no `middleware`).
Si coexisten `proxy.ts` y `middleware.ts`, el build falla con error de conflicto.
No crear `middleware.ts` bajo ninguna circunstancia.

```ts
// src/proxy.ts ✅
export function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }

// src/middleware.ts ❌ — rompe el build en Next.js 16
```

### Rewrites de `next.config.ts` son build-time, no runtime
Las URLs de destino en `async rewrites()` se resuelven durante `next build`, no al
arrancar el servidor. `process.env.MI_VAR` en el destino queda hardcodeada con el
valor del momento del build. No usar env vars en destinos de rewrites esperando que
cambien en runtime o entre entornos Docker.

### `NEXT_PUBLIC_*` requieren build ARG en Docker
Las vars `NEXT_PUBLIC_*` se bakean en el bundle del cliente durante el build.
En Docker, pasarlas como `ARG` en el Dockerfile y como `args:` en docker-compose.yml.
Setearlas como `environment:` en runtime no tiene efecto — el build ya terminó.

```dockerfile
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build
```

### Patrón de autenticación de este proyecto
- **Access token:** variable de módulo en `src/lib/auth.ts` (memoria pura). Se pierde al recargar; `src/lib/api.ts` lo refresca automáticamente en el primer 401.
- **Refresh token:** httpOnly cookie gestionada 100% por el backend. Nunca accederla desde JS.
- **Indicador de sesión:** cookie `pa_session=1` (no httpOnly), seteada por el FE al login y leída por `src/proxy.ts` para proteger rutas del dashboard.
- **Nunca** guardar JWTs en `localStorage`.

### API client (`src/lib/api.ts`)
- `BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'`
- El cliente llama directo al backend. CORS habilitado en el backend con `credentials: true`.
- Siempre `credentials: 'include'` en los fetches para que el browser mande la cookie `refresh_token` al endpoint de refresh.
- El refresh es transparente: un 401 dispara `POST /api/v1/auth/refresh` y reintenta automáticamente. Si el refresh también falla, redirige a `/login`.

### Sidebar — cómo agregar una nueva página
1. Crear la página en `src/app/(dashboard)/ruta/page.tsx`
2. En `src/components/layout/Sidebar.tsx`, en `NAV_ITEMS`, cambiar `exists: false → true`
3. Verificar que `roles` sea correcto (jerarquía: OWNER > ADMIN > MEMBER > OBSERVER)
La página solo aparece en el sidebar cuando `exists: true` Y el rol del usuario está en `roles`.

### Separación Settings vs Mi Comercio (decisión de UX)

- **`/dashboard/businesses` ("Mi Comercio")** → todo sobre el negocio *activo*: nombre, MP, suscripción. El título del page usa `businessName` del contexto. NO tiene botón para crear otro negocio.
- **`/dashboard/settings` ("Configuración")** → config del *usuario*: perfil, contraseña, dispositivos. Aquí también vivirá "Mis comercios" (lista + crear nuevo) cuando se implemente.
- El nav item "Comercios" se renombró a **"Mi Comercio"** para reflejar que muestra solo el activo.
- Settings es visible para **ALL_ROLES** — perfil/contraseña/dispositivos son configuración personal, no de negocio.

### Sidebar — BusinessSwitcher (multi-comercio)
El `Sidebar` incluye un componente `BusinessSwitcher` al tope:
- Muestra el nombre del comercio activo con avatar (primera letra)
- Si `businesses.length > 1`: muestra chevron y dropdown con todos los comercios
- Cada opción del dropdown muestra nombre + etiqueta de rol en español + checkmark en el activo
- Al seleccionar: llama `switchBusiness(id)` → `queryClient.clear()` → redirect `/dashboard`
- Cierra con click fuera (listener `mousedown` en `useEffect` con `useRef<HTMLDivElement>`)
- El `Sidebar` ya no recibe `role` como prop — usa `useActiveBusiness()` directamente

### `output: 'standalone'` — solo para Docker
`next.config.ts` puede tener `output: 'standalone'` para builds Docker multi-stage.
**No es necesario para Vercel** (el deploy actual usa Vercel, que ignora esta opción).
Si se vuelve a dockerizar, reactivar este setting.

### Íconos y OG image — generación dinámica (edge runtime)

No hay assets estáticos PNG/ICO en este proyecto. Todo se genera vía ImageResponse:

| Archivo | Dimensiones | Propósito |
|---------|------------|-----------|
| `src/app/icon.tsx` | 512×512 | Tab del browser, PWA launcher, share sheet |
| `src/app/apple-icon.tsx` | 180×180 | Apple touch icon (iOS add to homescreen) |
| `src/app/opengraph-image.tsx` | 1200×630 | OG/Twitter card |

Todos usan `export const runtime = 'edge'` y `export const contentType = 'image/png'`.
Next.js app directory los registra automáticamente en los `<link>` del `<head>`.
No agregar entradas manuales en `src/app/layout.tsx` — se duplicarían.

### PWA manifest y el install prompt de Chrome
`src/app/manifest.ts` debe incluir al menos un ícono con `purpose: 'any'`.
Chrome no muestra el botón de instalación si solo existe `purpose: 'maskable'`.

```ts
icons: [
  { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },      // ← requerido
  { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' }, // ← splash screens
],
```

### proxy.ts matcher — qué excluir
El matcher de `src/proxy.ts` debe excluir todos los endpoints que generan assets:

```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icon|apple-icon|manifest\\.webmanifest|opengraph-image|assets|api).*)'],
}
```

Si se agrega un nuevo endpoint de asset, agregarlo aquí o el middleware lo
redirigirá a `/login` cuando el usuario no tenga sesión.

### `public/` no puede estar vacío
Git no trackea directorios vacíos. Mantener `public/.gitkeep` siempre en el repo.
<!-- END:nextjs-agent-rules -->

---

## Biblioteca de componentes UI propios

### src/components/ui/
| Componente | Props clave | Notas |
|---|---|---|
| `Button` | `variant`, `size`, `loading`, `disabled` | primary/secondary/ghost/danger |
| `Input` | `label`, `error` | con estados disabled |
| `Card` | — | Card + CardHeader + CardTitle + CardDescription |
| `Spinner` | `size?: 'sm'\|'md'`, `className` | color override via className (default `border-primary`) |
| `Badge` | `className` | pill inline-flex; color completamente via className |
| `EmptyState` | `size?: 'sm'\|'default'`, `icon`, `title`, `description`, `className` | — |
| `SlideOver` | `title`, `subtitle`, `subtitleClassName`, `onClose`, `children` | panel fixed right |
| `ConfirmDialog` | `iconBgClass`, `confirmClassName`, `pendingLabel`, `closeOnBackdrop`, `description: ReactNode` | description es div (admite strong) |
| `StatCard` | `title`, `isLoading`, `caption`, `children` | skeleton animado cuando isLoading |
| `PaymentToast` / `PaymentToastContainer` | — | stack bottom-right, max 3, auto-dismiss 5s, sonido |

### src/components/layout/
| Componente | Descripción |
|---|---|
| `PageShell` | `{ title, children, className? }` — wrapper flex + Header + main p-6. Usar en todas las páginas del dashboard. |
| `Header` | `{ title }` — h-16 **shrink-0** (sin esto se comprime en flex column) |
| `Sidebar` | Nav items filtrados por rol + BusinessSwitcher al tope. Usa `useActiveBusiness()` directamente (sin prop de rol). Para agregar página: `exists: false → true` en `NAV_ITEMS` |
| `DashboardShell` | BusinessContext provider (con `businesses[]` + `switchBusiness()`) + DeviceLimitModal (ConfirmDialog) + PaymentToastContainer |

---

## Estado actual del proyecto

### Páginas implementadas

| Ruta | Archivo | Estado |
|------|---------|--------|
| `/` | `src/app/page.tsx` | ✅ Landing |
| `/login` | `src/app/(auth)/login/page.tsx` | ✅ + ojo toggle + link "¿Olvidaste tu contraseña?" |
| `/register` | `src/app/(auth)/register/page.tsx` | ✅ + ojo toggle |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | ✅ |
| `/reset-password/[token]` | `src/app/(auth)/reset-password/[token]/page.tsx` | ✅ |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | ✅ Stats + últimos pagos |
| `/dashboard/payments` | `src/app/(dashboard)/dashboard/payments/page.tsx` | ✅ Tabla, filtros, detalle, AFIP |
| `/dashboard/businesses` | `src/app/(dashboard)/dashboard/businesses/page.tsx` | ✅ Info comercio (título dinámico = businessName), MP, suscripción + banner onboarding |
| `/dashboard/members` | `src/app/(dashboard)/dashboard/members/page.tsx` | ✅ Tabla miembros + invitaciones + roles + revocar |
| `/dashboard/settings` | `src/app/(dashboard)/dashboard/settings/page.tsx` | ✅ Perfil + cambio de contraseña + dispositivos FCM |
| `/invitations/[token]` | `src/app/(auth)/invitations/[token]/page.tsx` | ✅ OTP + registro inline |

### BusinessContext — patrón central de datos
`DashboardShell` (`src/components/layout/DashboardShell.tsx`) hace `GET /businesses` al montar
y expone `{ businessId, businessName, role, businesses[], switchBusiness() }` via React Context.
Las páginas consumen `useActiveBusiness()` — no llaman a `/businesses` ellas mismas.

**Multi-business:** `switchBusiness(id)` cambia el negocio activo, llama `queryClient.clear()` para vaciar todo el caché y redirige a `/dashboard`. La interfaz `BusinessBrief = { id, name, role }` vive en `src/lib/business-context.tsx`.

**Visibilidad de cards por rol:** en `/dashboard`, las cards "Miembros activos" y "Suscripción" solo se muestran si `isManager = role === 'OWNER' || role === 'ADMIN'`. El grid adapta columnas: 4 columnas para managers, 2 para el resto. La card "Pagos recibidos hoy" y "Total del mes" son visibles para todos los roles.

### Backend que consume cada página

| Página | Endpoints |
|--------|-----------|
| `/dashboard` | `GET /businesses/:id/summary` |
| `/dashboard/payments` | `GET /businesses/:id/payments` · `GET /businesses/:id/payments/:id` · `GET /businesses/:id/payments/:id/afip` |
| `/dashboard/businesses` | `GET /businesses/:id` · `GET /businesses/:id/mp-connect` · `GET /businesses/:id/summary` |
| `/dashboard/members` | `GET /businesses/:id/members` · `POST /businesses/:id/invitations` · `DELETE /businesses/:id/invitations/:invId` · `PUT /businesses/:id/members/:memberId/role` · `DELETE /businesses/:id/members/:memberId` |
| `/dashboard/settings` | `GET /users/me` · `PUT /users/me` · `POST /auth/change-password` · `GET /users/me/devices` · `DELETE /users/me/devices/:id` |

### TanStack Query v5 — patrón de datos

`ReactQueryProvider` en `src/lib/query-client.tsx` wrappea toda la app en `layout.tsx`.

| Página / componente | `queryKey` | Cuándo refetch |
|---|---|---|
| `/dashboard` | `['summary', businessId]` | `refetchQueries` al recibir WS message |
| `/dashboard/payments` | `['payments', businessId, status, from, to, q]` | `refetchQueries` al recibir WS message |
| `/dashboard/members` | `['members', businessId]` | `invalidateQueries` luego de cada mutación |
| `DetailPanel` (AFIP) | `['afip', businessId, paymentId]` | Al abrir el panel (por `payment.id`) |
| `/dashboard/settings` (perfil) | `['me']` | `invalidateQueries` tras PUT exitoso |
| `/dashboard/settings` (devices) | `['devices']` | `invalidateQueries` tras DELETE exitoso |

- `DashboardShell.handleWsMessage` llama `refetchQueries` (no `invalidateQueries`) para forzar refetch inmediato aunque los datos no estén stale.
- Las mutaciones de members usan `queryClient.invalidateQueries({ queryKey: ['members', businessId] })` y confían en el refetch para actualizar la UI.

### WebSocket tiempo real

`DashboardShell` conecta automáticamente al WebSocket (`/api/v1/ws?token=<jwt>`) cuando el `businessId` está disponible.
- Hook: `src/lib/use-payment-websocket.ts` — reconexión con exponential backoff (1s→30s). Actualiza el ref del callback con `useLayoutEffect` sin deps para evitar closures stale.
- Toast: `src/components/ui/PaymentToast.tsx` — stack bottom-right, max 3, auto-dismiss 5s
- **Sonido:** AudioContext singleton en `PaymentToast.tsx`. Se crea una sola vez y se desbloquea en el primer gesto del usuario (`click`/`keydown`/`touchstart`). Registrado en `PaymentToastContainer` via `useEffect`. No crear `new AudioContext()` en cada llamada — el browser lo bloquea por autoplay policy.
- WS URL: `NEXT_PUBLIC_WS_URL` (ver env vars) — **no** usar `NEXT_PUBLIC_API_URL` para WS en local
- Endpoint de prueba local: `POST /dev/test-notify` (requiere Bearer JWT)

### Jerarquía de roles

```
OWNER > ADMIN > MEMBER > OBSERVER
```

El backend valida el rol en cada endpoint. El sidebar filtra ítems por `roles[]` en `NAV_ITEMS`.

---

## Deploy

| Servicio | Plataforma | URL |
|----------|-----------|-----|
| Frontend | **Vercel** (repo `GuilloSGit/pay-alert-app`) | `https://pay-alert.com.ar` |
| Backend API | **Render** | `https://pay-alert-api.onrender.com` |
| Worker BullMQ | **Render** | — |

### Variables de entorno en Vercel

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://pay-alert-api.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | `wss://pay-alert-api.onrender.com` |

### DNS

Dominio `pay-alert.com.ar` gestionado en **Vercel DNS** (NS apuntan a Vercel).
Registros relevantes:
- `A @` → `216.24.57.1` (Render)
- `CNAME www` → `pay-alert-app.onrender.com`
- Registros Resend (MX, TXT) para email

---

## Setup local

### Rewrites (OBLIGATORIO en local, NUNCA commitear)

`next.config.ts` debe tener este bloque para desarrollo local. Vercel lo maneja en producción via `NEXT_PUBLIC_API_URL`.

```ts
async rewrites() {
  return [{ source: '/api/v1/:path*', destination: 'http://localhost:3001/api/v1/:path*' }]
},
```

Sin este bloque, las llamadas a `/api/v1/*` llegan al servidor de Next.js y fallan.
Verificar que esté presente después de cualquier `git pull`, stash pop, o checkout.

### Variables de entorno locales

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

`NEXT_PUBLIC_API_URL=http://localhost:3000` usa las rewrites de Next.js para proxear HTTP.
`NEXT_PUBLIC_WS_URL=ws://localhost:3001` va directo al backend — Next.js **no** proxea WebSocket.

### Credenciales de prueba

```
owner@test.com / Test1234!   → OWNER, business: cmpa61k6h0002y5sf33s3ixaj
member@test.com / Test1234!  → MEMBER
```

### Puertos

| Servicio | Puerto |
|----------|--------|
| Frontend (Next.js) | 3000 |
| Backend API | 3001 |
| Postgres | 5432 |
| Redis | 6379 |
