# Pay Alert

**Notificaciones de cobro verificadas en tiempo real para comercios argentinos.**

> Cada alerta viene directamente de Mercado Pago — no de capturas de pantalla que cualquiera puede falsificar.

[![Live](https://img.shields.io/badge/Live-pay--alert.com.ar-059669?style=flat-square)](https://pay-alert.com.ar)
[![API](https://img.shields.io/badge/API-pay--alert--api.onrender.com-0ea5e9?style=flat-square)](https://pay-alert-api.onrender.com)
[![Admin](https://img.shields.io/badge/Admin-admin.pay--alert.com.ar-7c3aed?style=flat-square)](https://admin.pay-alert.com.ar)

---

## El problema

En Argentina, Mercado Pago procesa más del 40 % de las transacciones digitales. La gran mayoría de los negocios — farmacias, almacenes, locales de ropa, restaurantes — cobran por QR o transferencia. El flujo habitual es:

1. El cliente dice "ya te transferí" y muestra una captura de pantalla.
2. El empleado no puede verificarlo en el momento.
3. El producto sale. El pago no llegó.

Las capturas se falsifican en segundos. Los empleados no pueden acceder a la cuenta del dueño solo para confirmar un pago. El resultado: fraudes frecuentes, tensiones internas y dueños atados al celular todo el día.

---

## La solución

Pay Alert conecta la cuenta de Mercado Pago del comercio vía **OAuth oficial** y, cada vez que llega un pago, notifica al equipo en **segundos** — directamente desde los servidores de Mercado Pago, sin intermediarios, sin capturas.

El empleado ve: `$15.000 — Confirmado por Mercado Pago`. El dueño nunca entregó su contraseña.

```
Pago del cliente → Mercado Pago → Webhook → Pay Alert → Push / Dashboard
                                                 ↑
                                          < 5 segundos
```

---

## Mercado objetivo

| Segmento | Estimación |
|----------|-----------|
| Comercios con cuenta Mercado Pago en Argentina | +6 millones |
| Con al menos un empleado (target inicial) | ~1,5 millones |
| Objetivo año 1 (early adopters digitales) | 5.000 comercios |

El plan Profesional a $49.999 ARS/mes por 5.000 comercios representa ~$250M ARS/mes en MRR. La competencia directa es inexistente: nadie en Argentina ofrece alertas de pago verificadas con gestión de equipo y roles.

---

## Características del producto

### Tiempo real y verificado
- **WebSocket** siempre activo: cada pago actualiza el dashboard en menos de 5 segundos.
- **Push nativo** (Chrome, Firefox, Edge, Safari/iOS): el empleado recibe la alerta en la pantalla de bloqueo, sin la app abierta.
- **Origen garantizado**: el webhook lo firma Mercado Pago con HMAC-SHA256. Pay Alert verifica la firma antes de procesar cualquier evento.

### Gestión de equipo con roles granulares

| Rol | Capacidades |
|-----|-------------|
| **OWNER** | Control total. Único con acceso a suscripción y conexión MP. |
| **ADMIN** | Gestiona miembros, ve cierres y (si el dueño lo permite) conecta MP. |
| **MEMBER** | Recibe alertas. El dueño elige si puede configurar sus propias notificaciones. |
| **OBSERVER** | Solo visualización del historial. Sin alertas. |

Los empleados se suman con un link de invitación + OTP por email. Nunca ven la cuenta de Mercado Pago del dueño.

### Historial y reportes
- Búsqueda por fecha, monto, estado y método de pago.
- Exportación en **CSV, Excel (XLSX) y PDF** empresarial.
- **Cierres diarios** agrupados por método de cobro (QR, transferencia, tarjeta, etc.) — plan Profesional+.
- **Resumen diario por email** al cierre del día (enviado automáticamente por el worker BullMQ).
- Historial de 30 días (Básico), 1 año (Profesional) o ilimitado (Enterprise).
- Consulta de datos AFIP por CUIT desde el detalle de cada pago.

### Alertas configurables
- Umbral por monto mínimo: push solo para pagos mayores a $X.
- **Quiet hours**: silenciar notificaciones fuera del horario comercial.
- Múltiples dispositivos por usuario (límite configurable por plan).

### Multi-comercio
- Un usuario puede ser dueño o miembro de varios comercios.
- Business switcher en el sidebar: cambia de comercio en un click.
- Suscripción vinculada al OWNER; aplica a todos sus comercios.

### Webhooks salientes — plan Enterprise
- El comercio registra endpoints propios y recibe eventos firmados con HMAC-SHA256.
- Eventos disponibles: `payment.approved`, `payment.received`, `payment.refunded`, `payment.cancelled`.
- Permite integrar Pay Alert con sistemas ERP, contables o de stock propios.
- Documentación pública: [pay-alert.com.ar/developers](https://pay-alert.com.ar/developers).

### Seguridad
- Access token en memoria (nunca en `localStorage` ni cookies accesibles por JS).
- Refresh token en cookie `httpOnly`, gestionada exclusivamente por el backend.
- Tokens WebSocket efímeros (UUID con TTL 30 s) — el JWT nunca viaja en la URL del WebSocket.
- Credenciales MP cifradas con AES-256.
- SSL end-to-end. Rate limiting en todos los endpoints.

---

## Arquitectura técnica

```
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│         Frontend (Vercel)         │      │         Backend (Render)          │
│                                  │      │                                   │
│  Next.js 16 · React 19           │◄────►│  Fastify 5 · TypeScript           │
│  Tailwind 4 · TanStack Query 5   │  WS  │  Prisma 6 · PostgreSQL            │
│  PWA · Push Notifications        │      │  BullMQ · Redis                   │
│                                  │      │  Resend (emails transaccionales)  │
│  pay-alert.com.ar                │      │  pay-alert-api.onrender.com       │
└──────────────────────────────────┘      └──────────────────────────────────┘
                                                         │
                                          ┌──────────────┼──────────────┐
                                          ▼              ▼              ▼
                                     MercadoPago    Firebase FCM    Resend API
                                     (OAuth + WH)   (Push tokens)  (Email)
```

### Stack por capa

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Fastify 5, TypeScript, Prisma 6 |
| Base de datos | PostgreSQL |
| Cola de tareas | BullMQ + Redis |
| Autenticación | JWT (access en memoria + refresh httpOnly) |
| Push notifications | Firebase Cloud Messaging + Web Push API |
| Email transaccional | Resend |
| Suscripciones | Mercado Pago Subscriptions |
| Deploy frontend | Vercel (CI/CD automático desde GitHub) |
| Deploy backend | Render (API + BullMQ Worker) |
| DNS | Vercel DNS (`pay-alert.com.ar`) |
| Monitoreo | UptimeRobot |

### Flujo de pago en tiempo real

```
1. Cliente paga por QR o transferencia
2. Mercado Pago emite webhook → POST /api/v1/businesses/:id/payments/webhook
3. Backend verifica firma HMAC-SHA256
4. Persiste el pago en PostgreSQL
5. Publica evento en Redis (BullMQ)
6. Worker → push FCM a dispositivos del equipo + email resumen programado
7. WebSocket → emite a todos los clientes conectados del comercio
8. Dashboard y dispositivos móviles se actualizan en < 5 segundos
```

---

## Modelo de negocio

Suscripción mensual recurrente (MRR) cobrada vía **Mercado Pago Subscriptions**. 14 días de prueba gratis, sin tarjeta de crédito. Cancela en cualquier momento.

| Plan | Precio ARS/mes | Usuarios | Comercios | Historial | Exportación | Webhooks |
|------|---------------|----------|-----------|-----------|-------------|---------|
| **Básico** | $24.999 | 3 | 1 | 30 días | — | — |
| **Profesional** | $49.999 | 6 | 2 | 1 año | CSV / XLSX / PDF | — |
| **Enterprise** | A medida | Ilimitado | Ilimitado | Ilimitado | ✓ | ✓ |

**Unit economics (plan Profesional):**
- ARPU: $49.999 ARS/mes
- Costo operativo por cliente: < $1 USD/mes
- Churn objetivo: < 3 % mensual
- CAC estimado inicial: $0 (crecimiento orgánico — el producto se vende solo en comercios donde el empleado ya lo usa)

---

## Estado del producto — Junio 2026

### En producción

| Módulo | Estado |
|--------|--------|
| Landing page + onboarding wizard (3 pasos) | ✅ |
| Autenticación completa (registro, login, recuperación, OTP invitaciones) | ✅ |
| OAuth con Mercado Pago | ✅ |
| Dashboard con stats en tiempo real (WebSocket) | ✅ |
| Push nativo (Chrome, Firefox, Safari/iOS) | ✅ |
| Historial y filtros de pagos | ✅ |
| Exportación multi-formato (CSV, XLSX, PDF) | ✅ |
| Cierres diarios agrupados por método de cobro | ✅ |
| Resumen diario por email (BullMQ worker) | ✅ |
| Gestión de equipo (invitaciones, roles, permisos granulares) | ✅ |
| Multi-comercio con business switcher | ✅ |
| Suscripciones (Básico / Profesional / Enterprise) | ✅ |
| Facturación e historial de invoices con descarga PDF | ✅ |
| Webhooks salientes firmados con HMAC-SHA256 | ✅ |
| Alertas por monto mínimo | ✅ |
| Quiet hours configurables | ✅ |
| Consulta AFIP por CUIT desde detalle de pago | ✅ |
| API pública documentada + portal para developers | ✅ |
| Panel de administración interno | ✅ |
| PWA instalable (ícono homescreen, splash screen) | ✅ |
| Sistema de bug reports in-app | ✅ |

---

## Panel de administración — `admin.pay-alert.com.ar`

Panel interno privado para operar el negocio. Autenticación via header `x-admin-api-key`. Deploy independiente en Vercel.

### Módulos

#### Usuarios
- Lista paginada con búsqueda por nombre o email.
- Cantidad de comercios por usuario, fecha de registro, estado.

#### Comercios
- Filtros por plan activo, estado de suscripción y categoría de rubro.
- Estado de conexión con Mercado Pago y miembros activos.

#### Pagos globales
- Historial completo de todos los comercios para soporte y auditoría.
- Filtros cruzados por comercio, estado y rango de fechas.

#### Facturación
- Listado de invoices con estado PAID / PENDING / OVERDUE.
- Acciones manuales para casos fuera de ciclo.

#### Estado del sistema
- Métricas en tiempo real: usuarios activos, pagos procesados, tasa de error.
- Integración con UptimeRobot para historial de disponibilidad.

#### Bug reports (kanban)
- Reportes enviados in-app por usuarios: severidad, descripción, pasos, adjuntos.
- Estados: OPEN → IN\_PROGRESS → CLOSED.
- Cambiar estado dispara email automático al usuario que reportó.

### Endpoints

```
GET   /admin/users
GET   /admin/businesses
GET   /admin/payments
GET   /admin/invoices
GET   /admin/bugs
PATCH /admin/bugs/:id
GET   /admin/metrics
```

Todos paginados: `?page=&pageSize=` → `{ data, meta: { total, page, pageSize, totalPages } }`.

---

## API pública para desarrolladores

Documentación en [pay-alert.com.ar/developers](https://pay-alert.com.ar/developers) con ejemplos en Node.js, Python y PHP.

Los comercios Enterprise registran endpoints propios y reciben los eventos de pago firmados con HMAC-SHA256:

```js
// Verificación de firma (Node.js)
const signature = req.headers['x-pay-alert-signature']
const expected  = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
if (signature !== expected) return res.status(401).end()
```

**Eventos disponibles:** `payment.approved` · `payment.received` · `payment.refunded` · `payment.cancelled`

---

## Páginas del producto

| Ruta | Descripción |
|------|-------------|
| `/` | Landing pública |
| `/register` / `/login` | Auth con recuperación de contraseña |
| `/onboarding` | Wizard guiado: negocio → conectar MP → invitar equipo |
| `/dashboard` | Stats en tiempo real + últimos pagos |
| `/dashboard/payments` | Tabla completa, filtros, detalle, AFIP, exportación |
| `/dashboard/cierres` | Cierres diarios por método (Profesional+) |
| `/dashboard/members` | Gestión del equipo e invitaciones |
| `/dashboard/businesses` | Info del comercio, OAuth MP, suscripción |
| `/dashboard/settings` | Perfil, contraseña, dispositivos, alertas, permisos de roles |
| `/dashboard/facturacion` | Historial de facturas con descarga PDF (OWNER) |
| `/developers` | Documentación API pública |
| `/suscribirse` | Checkout de suscripción |
| `/invitations/:token` | Aceptar invitación al equipo |

---

## Infraestructura y costos operativos

| Servicio | Función | Costo estimado/mes |
|----------|---------|-------------------|
| Vercel | Frontend + Admin | $0–$20 USD |
| Render — API | Fastify 5 backend | $7 USD |
| Render — Worker | BullMQ worker | $7 USD |
| Render — PostgreSQL | Base de datos | $7 USD |
| Render — Redis | Cola BullMQ + WS pub/sub | $10 USD |
| Resend | Emails transaccionales | $0–$20 USD |
| Firebase | Push notifications | $0 |
| UptimeRobot | Monitoreo | $0 |
| **Total** | | **< $80 USD/mes** |

Márgenes operativos altos desde el primer cliente pagador. La arquitectura escala horizontalmente en Render sin cambios de código.

---

## Roadmap

### Corto plazo (Q3 2026)
- [ ] Panel Admin FE terminado (kanban bugs, métricas visuales)
- [ ] Integración con Modo y Naranja X
- [ ] Notificaciones por WhatsApp (Twilio / Meta API)

### Mediano plazo (Q4 2026 – Q1 2027)
- [ ] App móvil nativa (React Native) para mejor experiencia en iOS/Android
- [ ] Integración contable: exportación en formato AFIP / ARCA
- [ ] Expansión regional: Uruguay, Chile, Colombia (MercadoPago con presencia en los tres)

### Largo plazo
- [ ] Marketplace de integraciones (conectores para sistemas de gestión populares en Argentina)
- [ ] Analytics avanzado: tendencias, proyecciones, comparativas entre sucursales

---

## Oportunidad de inversión

Pay Alert está buscando capital para:

1. **Adquisición** — campañas dirigidas a comerciantes en Instagram/TikTok, alianzas con contadores y cámaras de comercio.
2. **Equipo** — soporte al cliente, ventas y un segundo desarrollador.
3. **Integración de más pasarelas** — Modo, Naranja X, Ualá.
4. **Expansión regional** — el modelo es replicable directamente en Uruguay, Chile y Colombia.

---

## Equipo

**Guillermo Andrada** — Fundador y desarrollador full-stack  
[ga-software.dev](https://ga-software.dev) · guillermoandrada@gmail.com  
WhatsApp: +54 387 629 5801

Desarrollador con experiencia en productos SaaS, integraciones con Mercado Pago y arquitecturas cloud. Pay Alert es un producto propio, construido de cero, 100 % funcional y en producción desde 2026.

---

## Setup local (para revisión técnica)

```bash
# Frontend (este repositorio)
cp .env.example .env.local
# Setear NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev       # http://localhost:3000

# Backend (pay-alert-api)
docker compose up -d    # Postgres (5432) + Redis (6379)
npm run dev             # API en http://localhost:3001
npm run dev:worker      # BullMQ worker
```

Credenciales de prueba: `owner@test.com` / `Test1234!`

---

*Pay Alert — Producto 100 % argentino. No afiliado con Mercado Libre S.A.*
