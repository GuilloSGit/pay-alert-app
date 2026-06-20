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
- **⚠️ `api.post(path)` sin body → 400 en Fastify 5:** el cliente siempre agrega `Content-Type: application/json` en POST. Si no se pasa body, `JSON.stringify(undefined)` = `undefined` (sin body), pero el header queda → Fastify 5 rechaza con 400. Siempre pasar `{}` cuando no hay body real: `api.post(path, {})`.

### Logout — conectado al API
`handleLogout()` en `Sidebar.tsx` es `async` y llama `api.post('/api/v1/auth/logout', {})` antes de `clearSession()`. El BE revoca el refresh token en DB (sin esto, la cookie httpOnly httpOnly sigue válida hasta expirar ~7d). El `try/catch` garantiza que el logout local siempre ocurra aunque el API no responda.

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

### `fetchExportRows` — debe usar `NEXT_PUBLIC_API_URL`, no URL relativa
`src/lib/export-payments.ts` hace un `fetch` nativo (no usa `api.ts`) porque necesita leer la respuesta como `text()` en vez de JSON. **Trampa:** si se usa una URL relativa (`/api/v1/...`), funciona local (gracias al rewrite de `next.config.ts`) pero falla en producción (Vercel no tiene ese rewrite). Siempre usar `${BASE_URL}/api/v1/...` donde `BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'`.

`fetchExportRows` también implementa su propio ciclo de refresh-retry:
1. Si no hay token → `tryRefresh()` antes de hacer el fetch
2. Si el fetch devuelve 401 → `tryRefresh()` y reintenta una vez
El token ya no se pasa como parámetro — se maneja internamente.

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
`src/app/manifest.ts` usa íconos PNG estáticos en `public/icons/`:
- `icon-192x192.png` — notificaciones push + Chrome install prompt
- `icon-512x512.png` — splash screens + maskable
- `badge-72x72.png` — barra de estado Android (referenciado en `firebase-messaging-sw.js`)

Chrome no muestra el botón de instalación si solo existe `purpose: 'maskable'`.
Siempre incluir un ícono con `purpose: 'any'`.

Los íconos se generaron con Python Pillow (campana blanca, círculo verde #059669, fondo #040c07).
Si se quieren regenerar: ver script en la sesión 30 del historial.

### favicon e íconos dinámicos (Next.js)
`src/app/icon.tsx` y `src/app/apple-icon.tsx` generan el favicon del browser dinámicamente.
**viewBox crítico:** usar `"9 5 14 19"` (bounds reales de la campana SVG), NO `"0 0 32 32"`.
Con el viewBox amplio la campana queda chiquitita en la pestaña del browser.

### Service Worker FCM — `public/firebase-messaging-sw.js`
- `onBackgroundMessage`: siempre adjuntar `data: payload.data` y `tag: data.paymentId` a `showNotification`
- Siempre tener un `notificationclick` handler que abra `/dashboard/payments`
- Sin estos, el click en la notificación nativa no hace nada

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
| `Sidebar` | Props: `{ isOpen: boolean; onClose: () => void }`. Drawer fixed mobile, static desktop. Secciones: "NEGOCIO" / "FINANZAS" (OWNER: Facturación) / "CUENTA". **Wizard de Inicio:** item iridiscente (gradiente cyan→violeta→fucsia, animación `iridescent` + `neon-pulse` en `globals.css`) visible mientras `!localStorage['pa_onboarding_done']`. Inicializado con lazy `useState(() => !localStorage.getItem(...))` (safe SSR). `ONBOARDING_DONE_KEY` exportado como constante para usar en `/onboarding/page.tsx`. |
| `DashboardShell` | BusinessContext provider. Si `businesses.length === 0` al cargar → `router.replace('/onboarding')`. Resto: set businessId/name/role, fetch suscripción, WS, DeviceLimitModal, toasts. |
| `SubscriptionBanner` | Naranja si `mpTokenInvalid` (solo OWNER ve "Reconectar →"); amarillo (TRIALING ≤7 días); rojo (PAST_DUE): OWNER ve mensaje + link a `mercadopago.com.ar/subscriptions`, non-OWNER ve "Avisale al dueño del comercio". |
| `SubscriptionGate` | Overlay para SUSPENDED/CANCELLED. Texto genérico para SUSPENDED (no asume trial). CTA "Reactivar acceso" → settings#suscripcion. |

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
| `/` | `src/app/page.tsx` | ✅ Landing |
| `/login` | `src/app/(auth)/login/page.tsx` | ✅ |
| `/register` | `src/app/(auth)/register/page.tsx` | ✅ |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | ✅ |
| `/reset-password/[token]` | `src/app/(auth)/reset-password/[token]/page.tsx` | ✅ |
| `/onboarding` | `src/app/onboarding/page.tsx` | ✅ Wizard 3 pasos standalone (sin sidebar). Skip inteligente: detecta negocio+MP al cargar, salta al paso correcto. `localStorage['pa_onboarding_done']` = controla visibilidad del sidebar item. |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | ✅ Stats + últimos pagos |
| `/dashboard/payments` | `src/app/(dashboard)/dashboard/payments/page.tsx` | ✅ Tabla, filtros, detalle, AFIP |
| `/dashboard/businesses` | `src/app/(dashboard)/dashboard/businesses/page.tsx` | ✅ Info comercio, MP (OAuth), suscripción. Rubro: select 11 categorías. Form APP_USR- eliminado — solo OAuth. |
| `/dashboard/members` | `src/app/(dashboard)/dashboard/members/page.tsx` | ✅ Tabla miembros + invitaciones + roles + revocar |
| `/dashboard/settings` | `src/app/(dashboard)/dashboard/settings/page.tsx` | ✅ Perfil + Seguridad + Dispositivos + MP Connect + Suscripción. Banner "Asistente de configuración" → /onboarding |
| `/dashboard/facturacion` | `src/app/(dashboard)/dashboard/facturacion/page.tsx` | ✅ OWNER only. Historial invoices paginado. Descarga PDF con `src/lib/invoice-pdf.ts` (jsPDF dinámico). |
| `/dashboard/cierres` | `src/app/(dashboard)/dashboard/cierres/page.tsx` | ✅ Tabla cierres con blur-gate por plan |
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

### Push notifications — flujo de permiso

`registerPushIfPermitted()` en `src/lib/push.ts` pide permiso al browser, registra el SW de FCM y hace POST a `/users/me/devices`.

**Regla (sesión 32 — actualizada):** `registerPushIfPermitted()` se llama automáticamente desde `DashboardShell` al montar (junto con `registerDevice()`). No espera un click del usuario. La primera vez que el usuario entra al dashboard, el browser muestra el popup de permiso. Esto es deseable: sin MP conectado ni notificaciones configuradas, Pay Alert no sirve de nada. También se llama desde `DevicesSection` para refrescar el estado.

`DevicesSection` lee `Notification.permission` con `useState` lazy (no `useEffect`) y muestra un banner si `!== 'granted'`.

**Device names (sesión 35):** `push.ts` detecta browser + OS del userAgent y construye `deviceName = "${browser} en ${os}"` antes de registrar el dispositivo. Si `Notification.permission === 'granted'`, el banner "Activar" no aparece — eso es correcto. Para testar push en producción sin pago real de MP: `curl -X POST https://pay-alert-api.onrender.com/api/v1/admin/test-notification/<businessId> -H "x-admin-api-key: <ADMIN_API_KEY>"`
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

### NoMpConnectionBanner (sesión 33)
`src/components/ui/NoMpConnectionBanner.tsx` — componente que verifica si hay MP conectado y activo.
- Usa `useQuery(['mp-connect', businessId])` con `staleTime: 60_000` (mismo queryKey que MpConnectSection → cache compartida)
- Si `connection === null || !connection.isActive` → banner naranja con CTA
- Si activo → `return null` (invisible)
- OWNER: botón OAuth directo + link al asistente `/onboarding`
- Otros roles: "Avisale al propietario del comercio"
- Renderizado al principio de `/dashboard/page.tsx` y `/dashboard/payments/page.tsx`

### OAuth MP — flujo de retorno (sesión 32-33)
El backend valida `returnTo` contra `ALLOWED_RETURN_PATHS` (hardcodeada en `mp-connect.ts`):
```ts
const ALLOWED_RETURN_PATHS = ['/dashboard/settings', '/onboarding', '/dashboard/businesses']
```
Si se agrega una nueva página que debe recibir `?mp=connected` al volver, agregar aquí.
Los params se leen con `useSearchParams()` y se limpian con `router.replace(pathname)` para no quedar en la URL.

**Gotcha Next.js — Suspense boundary:**  
`useSearchParams()` en un componente `'use client'` fuerza un CSR bailout si no está envuelto en `<Suspense>`. Next.js lo detecta en build y falla el export. Patrón correcto:
```tsx
// Extraer la lógica con useSearchParams a un sub-componente
function MpCallbackHandler({ setFoo, setBar }) {
  const searchParams = useSearchParams()
  // ... lógica
  return null
}
// Y en el componente padre, envolverlo:
<Suspense fallback={null}>
  <MpCallbackHandler setFoo={setFoo} setBar={setBar} />
</Suspense>
```
Aplicado en `businesses/page.tsx` y `settings/_sections/MpConnectSection.tsx` (sesión 34-35). Verificar con build local antes de push.

**Gotcha — SameSite=Lax en pa_session:**  
`pa_session` en `src/lib/auth.ts` usa `SameSite=Lax`, NO `SameSite=Strict`. Con Strict, el cookie no llega en redirects cross-site top-level (ej: volver del OAuth de MP desde `onrender.com` → `pay-alert.com.ar`), y el middleware de Next.js redirige al login en vez del dashboard. No cambiar a Strict.

## Roadmap FE — pendientes (estado 2026-06-20)

### ✅ Completados esta sesión (sesión 9 — 2026-06-17)
- **P3 Onboarding MP Connect — SlideOver:** link "¿Cómo obtengo el token?" bajo el `PasswordInput` en `MpConnectSection` (solo OWNER, solo cuando no hay MP conectado). Abre `SlideOver` con banner naranja "Necesitás un Access Token de producción" + 3 pasos numerados: (1) crear app en mercadopago.com.ar/developers/panel/app, (2) copiar Access Token desde Credenciales → Producción (monospace `APP_USR-`), (3) pegar en Settings → Conectar. Botón "Entendido" cierra.

### ✅ Completados (sesión 7 — 2026-06-16)
- **Crear comercio desde la UI** — sección "Mis comercios" en `/dashboard/settings`: lista negocios con rol + badge "Activo", modal "Agregar comercio" → POST /businesses → `refreshBusinesses(id)` → redirect `/dashboard`
- **MP Connect UI** — sección en `/dashboard/settings#mp-connect` con 3 estados: conectado (ID MP + fecha + badge + botón "Desconectar"), desconectado (PasswordInput token + botón "Conectar"), token vencido (banner naranja + form reconexión). Códigos de error mapeados: `INVALID_MP_TOKEN` → mensaje específico, `MP_ACCOUNT_ALREADY_CONNECTED` → `err.message` del BE.
- **WS `mp.token_invalid`** — `DashboardShell` maneja el mensaje → `setMpTokenInvalid(true)`. `SubscriptionBanner` muestra banner naranja con "Reconectar →" (solo OWNER). `switchBusiness` resetea a `false`.

### ✅ Completado (2026-06-18 — sesiones 16+17) — Exportación multi-formato + UX plan gate
- `ExportDropdown` reemplaza el botón "Exportar CSV" con dropdown: CSV · Excel (XLSX) · PDF empresarial.
- `src/components/ui/ExportDropdown.tsx` + `src/lib/export-payments.ts`
- Librerías: `xlsx` (SheetJS) + `jspdf` + `jspdf-autotable`. PDF con importación dinámica.
- `fetchExportRows()`: fetch al BE + parse CSV + humanización (método de pago, estado, fechas).
- Exporta exactamente los registros del filtro activo (status, from, to, q).
- **Prop `locked?: boolean`:** cuando `true`, muestra el botón disabled con badge ámbar "Business" y tooltip on hover. `payments/page.tsx` pasa `locked={planFeatures !== undefined && !planFeatures.dataExport}` — el botón siempre es visible, nunca se oculta.
- **Gotcha:** `getUser()` de `auth.ts` para nombre del usuario — no `getAccessToken()`.

### Prioridad 3 — Features Business+
- ~~Exportación CSV de pagos~~ ✅ (ahora multi-formato)
- ~~Alertas por monto mínimo configurables~~ ✅
- ~~Resumen diario por email~~ ✅ (BE hecho, no requiere UI)

### Prioridad 4 — Panel Admin interno (`pay-alert-admin`)
Repo separado, deploy en `admin.pay-alert.com.ar` (Vercel — DNS gestionado por Vercel NS, configurar CNAME desde el proyecto en Vercel).
- **Clientes** — tabla de usuarios y comercios, estado de suscripción, acciones manuales
- **Pagos globales** — historial de todos los comercios para soporte y auditoría
- **Facturas** — listado con estado PAID/PENDING/OVERDUE
- **Estado del sistema** — métricas de `GET /admin/metrics` + integración UptimeRobot (`https://stats.uptimerobot.com/8wBVJ8r93D`)
- **Bug reports** — kanban OPEN/IN_PROGRESS/CLOSED, cambiar estado dispara email al usuario

**✅ BE listo (sesión 12):** todos los endpoints necesarios implementados en `src/routes/admin/resources.ts`. Autenticación: header `x-admin-api-key`. Paginación offset: `?page=&pageSize=` → `meta: { total, page, pageSize, totalPages }`.
- `GET /admin/users` · `GET /admin/businesses` · `GET /admin/payments` · `GET /admin/invoices` · `GET /admin/bugs` · `PATCH /admin/bugs/:id`

### ✅ Completado (2026-06-18 — sesión 15) — Página /developers
- `src/app/developers/page.tsx` — Server Component público (sin auth)
- Contenido: flujo 3 pasos, HMAC-SHA256 verification (Node.js + Python + PHP), referencia payload, tabla eventos, ejemplos curl, buenas prácticas, CTA.
- **Gotcha proxy:** toda ruta nueva pública (sin auth) debe agregarse a `PUBLIC_PATHS` en `src/proxy.ts`. Sin esto el middleware redirige a `/login` para usuarios sin sesión. `/developers` ya está en la lista.
- Landing: link "Developers" en nav principal + columna "Developers" en footer.

### ✅ Completado (2026-06-17 — sesión 11) — Reporte de bugs / Nosotros
- `BugReportModal` + botón en Sidebar sobre "Cerrar sesión"
- Portal a `document.body` para evitar confinamiento por `transform` del sidebar
- Sección `#nosotros` en landing: Guillermo Andrada, ga-software.dev, servicios a medida

### ✅ Completado (2026-06-17 — sesión 11) — Reporte de bugs (FE)
- `BugReportModal` + botón en Sidebar sobre "Cerrar sesión"
- Portal a `document.body` para evitar confinamiento por `transform` del sidebar
