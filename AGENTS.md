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
- **User en `localStorage`:** `saveSession(token, user)` guarda `{ id, email, name }` en `localStorage[pa_user]` al login. El Header lo lee via `useSyncExternalStore + getUser()`.
- **`updateUser(patch)`:** actualiza `localStorage` y dispara `StorageEvent` manualmente → el Header re-renderiza sin recargar. Llamar siempre que se edite el perfil del usuario. **Trampa:** el evento `storage` nativo solo se dispara entre tabs; para el mismo tab hay que despacharlo con `window.dispatchEvent(new StorageEvent('storage', { key, newValue }))`.


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
| `BugReportModal` | `onClose` | **Siempre usar `createPortal → document.body`** — el `translate-x-0` del sidebar crea stacking context y confina `position:fixed`. Campos: severidad, descripción, frecuencia, pasos, expected, adjuntos. Combina en `steps` al enviar. |

### src/components/layout/
| Componente | Descripción |
|---|---|
| `PageShell` | `{ title, children, className? }` — wrapper flex + Header + main `p-4 sm:p-6`. Usar en todas las páginas del dashboard. |
| `Header` | `{ title }` — h-16 **shrink-0**; consume `openSidebar()` de `useActiveBusiness()` para el hamburger `lg:hidden`; nombre usuario `hidden sm:block`; padding `px-4 lg:px-6`. |
| `Sidebar` | Props: `{ isOpen: boolean; onClose: () => void }`. Drawer `fixed inset-y-0 left-0 z-50` en mobile con overlay `z-40`; `lg:static lg:translate-x-0` en desktop. Dos secciones: `BUSINESS_NAV` / `ACCOUNT_NAV` con labels "NEGOCIO"/"CUENTA". Para agregar página: agregar a `BUSINESS_NAV` o `ACCOUNT_NAV` con `exists: true`. NavLinks llaman `onClose` al clickear (cierra drawer en mobile). |
| `DashboardShell` | BusinessContext provider + `sidebarOpen` state + fetch `/subscription` por businessId + listeners `subscription:inactive`/`subscription:warning` + `mpTokenInvalid` state (bool) + DeviceLimitModal + PaymentToastContainer + SubscriptionBanner + SubscriptionGate |
| `SubscriptionBanner` | Banner no bloqueante: naranja 1º prioridad si `mpTokenInvalid` (link "Reconectar →" a `/dashboard/settings#mp-connect`, solo OWNER); amarillo (TRIALING ≤7 días); rojo (PAST_DUE). Vive antes de `{children}` en el shell. |
| `SubscriptionGate` | Overlay `absolute inset-0 z-40 backdrop-blur-sm` para SUSPENDED/CANCELLED. Sidebar queda interactivo. CTA varía por rol. |

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
| `/dashboard/settings` | `src/app/(dashboard)/dashboard/settings/page.tsx` | ✅ Mis comercios + MP Connect + Suscripción + Perfil + Seguridad + Dispositivos FCM |
| `/invitations/[token]` | `src/app/(auth)/invitations/[token]/page.tsx` | ✅ OTP + registro inline |
| `/suscripcion/resultado` | `src/app/suscripcion/resultado/page.tsx` | ✅ Página pública post-checkout MP |

### BusinessContext — patrón central de datos
`DashboardShell` (`src/components/layout/DashboardShell.tsx`) hace `GET /businesses` al montar
y expone via React Context:
```ts
{ businessId, businessName, role, businesses[], switchBusiness(),
  refreshBusinesses(switchToId: string),   // re-fetch /businesses y cambia al comercio indicado
  subscriptionStatus, trialEndsAt, subscriptionWarning,
  openSidebar() }   // ← Header llama esto para abrir el drawer mobile
```
`subscriptionStatus` viene de `GET /businesses/:id/subscription` (se refetch en cada cambio de businessId).
`subscriptionWarning` se setea cuando `api.ts` recibe el header `X-Subscription-Warning`.
`refreshBusinesses(switchToId)` re-fetcha `/businesses`, actualiza la lista y cambia al comercio con ese id. Usar después de crear un comercio nuevo. **No llamar dentro de un `useEffect`** — dispara `react-hooks/set-state-in-effect`. Llamar en callbacks (`.then()`, handlers).
Las páginas consumen `useActiveBusiness()` — no llaman a `/businesses` ni `/subscription` ellas mismas (excepción: Settings tiene su propio fetch de suscripción para mostrar detalles completos del plan).

**Multi-business:** `switchBusiness(id)` cambia el negocio activo, llama `queryClient.clear()` para vaciar todo el caché y redirige a `/dashboard`. La interfaz `BusinessBrief = { id, name, role }` vive en `src/lib/business-context.tsx`.

**Visibilidad de cards por rol:** en `/dashboard`, las cards "Miembros activos" y "Suscripción" solo se muestran si `isManager = role === 'OWNER' || role === 'ADMIN'`. El grid adapta columnas: 4 columnas para managers, 2 para el resto. La card "Pagos recibidos hoy" y "Total del mes" son visibles para todos los roles.

### Backend que consume cada página

| Página | Endpoints |
|--------|-----------|
| `/dashboard` | `GET /businesses/:id/summary` |
| `/dashboard/payments` | `GET /businesses/:id/payments` · `GET /businesses/:id/payments/:id` · `GET /businesses/:id/payments/:id/afip` |
| `/dashboard/businesses` | `GET /businesses/:id` · `GET /businesses/:id/mp-connect` · `GET /businesses/:id/summary` |
| `/dashboard/members` | `GET /businesses/:id/members` · `POST /businesses/:id/invitations` · `DELETE /businesses/:id/invitations/:invId` · `PUT /businesses/:id/members/:memberId/role` · `DELETE /businesses/:id/members/:memberId` |
| `/dashboard/settings` | `GET /users/me` · `PUT /users/me` · `POST /auth/change-password` · `GET /users/me/devices` · `DELETE /users/me/devices/:id` · `GET /businesses/:id/mp-connect` · `POST /businesses/:id/mp-connect` · `DELETE /businesses/:id/mp-connect` · `POST /businesses` |

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
| `/dashboard/settings` (MP connect) | `['mp-connect', businessId]` | `invalidateQueries` tras connect/disconnect |

- `DashboardShell.handleWsMessage` llama `refetchQueries` (no `invalidateQueries`) para forzar refetch inmediato aunque los datos no estén stale.
- **Patrón `cancelled` en useEffect async:** en `DashboardShell` el fetch de `/subscription` usa `let cancelled = false` + `return () => { cancelled = true }` + guard `if (cancelled) return` en `.then()`. Evita aplicar resultados stale al cambiar de negocio y elimina el `setSubscriptionStatus(null)` sincrónico que disparaba `react-hooks/set-state-in-effect`.
- Las mutaciones de members usan `queryClient.invalidateQueries({ queryKey: ['members', businessId] })` y confían en el refetch para actualizar la UI.

### WebSocket tiempo real

`DashboardShell` conecta automáticamente al WebSocket cuando el `businessId` está disponible. **Flujo auth v2 (desde sesión 14):** `connect()` es `async`:
1. Llama `POST /api/v1/auth/ws-token` (Bearer JWT) → recibe UUID efímero (TTL 30s)
2. Abre `new WebSocket('wss://...?token=<uuid>')` — el servidor valida y consume el token en el preHandler antes del upgrade
3. `ws.onopen` no envía nada — auth ya fue validado server-side
4. Si la conexión cae (cualquier close), reconecta con backoff exponencial (1s→30s) + nuevo POST /auth/ws-token

`api.post` maneja automáticamente el refresh del access token si expiró. Si el refresh falla, redirige a `/login`.
- Hook: `src/lib/use-payment-websocket.ts` — reconexión con exponential backoff (1s→30s). Actualiza el ref del callback con `useLayoutEffect` sin deps para evitar closures stale.
- Toast: `src/components/ui/PaymentToast.tsx` — stack bottom-right, max 3, auto-dismiss 5s
- **Sonido:** AudioContext singleton en `PaymentToast.tsx`. Se crea una sola vez y se desbloquea en el primer gesto del usuario (`click`/`keydown`/`touchstart`). Registrado en `PaymentToastContainer` via `useEffect`. No crear `new AudioContext()` en cada llamada — el browser lo bloquea por autoplay policy.
- WS URL: `NEXT_PUBLIC_WS_URL` (ver env vars) — **no** usar `NEXT_PUBLIC_API_URL` para WS en local
- Endpoint de prueba local: `POST /dev/test-notify` (requiere Bearer JWT)
- **`WsMessage` union:** `WsPaymentMessage | WsMpTokenInvalidMessage`. El hook filtra mensajes: pasa `payment.*` y `mp.token_invalid`; descarta el resto. `DashboardShell.handleWsMessage` distingue: `mp.token_invalid` → `setMpTokenInvalid(true)`; `payment.*` → toast + refetch queries.

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

---

## Roadmap FE — pendientes (estado 2026-06-17)

### ✅ Completados esta sesión (sesión 9 — 2026-06-17)
- **P3 Onboarding MP Connect — SlideOver:** link "¿Cómo obtengo el token?" bajo el `PasswordInput` en `MpConnectSection` (solo OWNER, solo cuando no hay MP conectado). Abre `SlideOver` con banner naranja "Necesitás un Access Token de producción" + 3 pasos numerados: (1) crear app en mercadopago.com.ar/developers/panel/app, (2) copiar Access Token desde Credenciales → Producción (monospace `APP_USR-`), (3) pegar en Settings → Conectar. Botón "Entendido" cierra.

### ✅ Completados (sesión 7 — 2026-06-16)
- **Crear comercio desde la UI** — sección "Mis comercios" en `/dashboard/settings`: lista negocios con rol + badge "Activo", modal "Agregar comercio" → POST /businesses → `refreshBusinesses(id)` → redirect `/dashboard`
- **MP Connect UI** — sección en `/dashboard/settings#mp-connect` con 3 estados: conectado (ID MP + fecha + badge + botón "Desconectar"), desconectado (PasswordInput token + botón "Conectar"), token vencido (banner naranja + form reconexión). Códigos de error mapeados: `INVALID_MP_TOKEN` → mensaje específico, `MP_ACCOUNT_ALREADY_CONNECTED` → `err.message` del BE.
- **WS `mp.token_invalid`** — `DashboardShell` maneja el mensaje → `setMpTokenInvalid(true)`. `SubscriptionBanner` muestra banner naranja con "Reconectar →" (solo OWNER). `switchBusiness` resetea a `false`.

### Prioridad 3 — Features Business+
- Exportación CSV de pagos
- Alertas por monto mínimo configurables
- Resumen diario por email

### Prioridad 4 — Panel Admin interno (`pay-alert-admin`)
Repo separado, deploy en `admin.pay-alert.com.ar` (Vercel — DNS gestionado por Vercel NS, configurar CNAME desde el proyecto en Vercel).
- **Clientes** — tabla de usuarios y comercios, estado de suscripción, acciones manuales
- **Pagos globales** — historial de todos los comercios para soporte y auditoría
- **Facturas** — listado con estado PAID/PENDING/OVERDUE
- **Estado del sistema** — métricas de `GET /admin/metrics` + integración UptimeRobot (`https://stats.uptimerobot.com/8wBVJ8r93D`)
- **Bug reports** — kanban OPEN/IN_PROGRESS/CLOSED, cambiar estado dispara email al usuario

**✅ BE listo (sesión 12):** todos los endpoints necesarios implementados en `src/routes/admin/resources.ts`. Autenticación: header `x-admin-api-key`. Paginación offset: `?page=&pageSize=` → `meta: { total, page, pageSize, totalPages }`.
- `GET /admin/users` · `GET /admin/businesses` · `GET /admin/payments` · `GET /admin/invoices` · `GET /admin/bugs` · `PATCH /admin/bugs/:id`

### Prioridad 4 — Página "Equipo / About"
- Sección en landing o `/about` presentando a Guillermo Andrada (https://ga-software.dev) y la oferta de servicios
- Decidir: sección de scroll en la landing actual o página separada `/about`

### ✅ Completado (2026-06-17 — sesión 11) — Reporte de bugs (FE)
- `BugReportModal` + botón en Sidebar sobre "Cerrar sesión"
- Portal a `document.body` para evitar confinamiento por `transform` del sidebar
