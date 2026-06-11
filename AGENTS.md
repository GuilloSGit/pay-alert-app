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

### `output: 'standalone'` requerido para Docker
`next.config.ts` debe tener `output: 'standalone'` para que el Dockerfile multi-stage
copie solo `.next/standalone/` en la imagen final (runner stage).
<!-- END:nextjs-agent-rules -->
