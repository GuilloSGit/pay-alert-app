import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nunca más confíes en comprobantes falsos',
  description:
    'Recibí confirmaciones reales de Mercado Pago en menos de 15 segundos. Tu equipo ve las alertas que vos querés, sin acceso a tu cuenta.',
  openGraph: {
    title: 'Pay Alert — Nunca más confíes en comprobantes falsos',
    description:
      'Recibí confirmaciones reales de Mercado Pago en menos de 15 segundos. Tu equipo ve las alertas que vos querés, sin acceso a tu cuenta.',
    url: 'https://pay-alert.com.ar',
    type: 'website',
  },
}

// ─── SVG icons ───────────────────────────────────────────────────────────────

function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#059669" />
      <path d="M16 6a2 2 0 0 0-2 2v.87A6 6 0 0 0 10 15v4l-1.5 1.5V21h15v-.5L22 19v-4a6 6 0 0 0-4-5.87V8a2 2 0 0 0-2-2z" fill="white" />
      <path d="M13.5 21a2.5 2.5 0 0 0 5 0h-5z" fill="white" />
    </svg>
  )
}

function Check({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function UptimeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function MPIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  )
}

// Feature icons
function VerifiedIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function RolesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function DeviceIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────────

const TRUST = [
  { icon: ShieldIcon, label: 'SSL Seguro' },
  { icon: LockIcon, label: 'Encriptación E2E' },
  { icon: UptimeIcon, label: '99.9% Uptime' },
  { icon: MPIcon, label: 'Integración oficial MP' },
]

const FEATURES = [
  {
    icon: VerifiedIcon,
    title: 'Verificación real',
    description: 'Cada alerta viene directamente de Mercado Pago. No de capturas de pantalla que cualquiera puede falsificar.',
  },
  {
    icon: BoltIcon,
    title: 'Menos de 15 segundos',
    description: 'Desde que el cliente confirma el pago hasta que tu equipo recibe la notificación pasan menos de 15 segundos.',
  },
  {
    icon: TeamIcon,
    title: 'Tu equipo sin riesgos',
    description: 'Invitá empleados para que reciban alertas en tiempo real, sin darles acceso a tu cuenta de Mercado Pago.',
  },
  {
    icon: RolesIcon,
    title: 'Roles y permisos',
    description: 'Decidís qué ve cada persona. Dueño, admin, empleado u observador — vos controlás el acceso.',
  },
  {
    icon: HistoryIcon,
    title: 'Historial completo',
    description: 'Todos tus cobros en un solo lugar. Buscá por fecha, monto o estado y llevá el control de tu caja.',
  },
  {
    icon: DeviceIcon,
    title: 'Cualquier dispositivo',
    description: 'Funciona en cualquier navegador — celular, tablet o computadora. Sin app que instalar.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Conectá tu cuenta de Mercado Pago',
    description: 'Vinculás tu cuenta MP en segundos usando la integración oficial. No compartís tu contraseña.',
  },
  {
    n: '02',
    title: 'Invitá a tu equipo',
    description: 'Agregás empleados por email y asignás roles. Ellos reciben alertas; vos mantenés el control.',
  },
  {
    n: '03',
    title: 'Recibís alertas verificadas',
    description: 'Cada pago confirmado dispara una notificación en tiempo real. Sin esperar, sin comprobantes dudosos.',
  },
]

const PLANS = [
  {
    name: 'Básico',
    price: '$24.999',
    period: '/mes',
    desc: 'Para comercios que quieren empezar con confianza.',
    capacity: '3 usuarios · 1 comercio',
    popular: false,
    features: [
      'Alertas en tiempo real',
      'Hasta 3 usuarios',
      '1 comercio',
      '30 días de historial',
      'Soporte por email',
    ],
    cta: 'Comenzar ahora',
    href: '/register',
  },
  {
    name: 'Profesional',
    price: '$49.999',
    period: '/mes',
    desc: 'Para negocios en crecimiento con equipos más grandes.',
    capacity: '6 usuarios · 2 comercios',
    popular: true,
    features: [
      'Todo lo del plan Básico',
      'Hasta 6 usuarios',
      'Hasta 2 comercios',
      '1 año de historial',
      'Alerta por monto mínimo',
      'Exportación CSV',
      'Soporte prioritario',
    ],
    cta: 'Comenzar ahora',
    href: '/register',
  },
  {
    name: 'Enterprise',
    price: 'A medida',
    period: '',
    desc: 'Para cadenas y franquicias con múltiples puntos de venta.',
    capacity: 'Usuarios y comercios ilimitados',
    popular: false,
    features: [
      'Todo lo del plan Profesional',
      'Comercios ilimitados',
      'Usuarios ilimitados',
      'Historial completo',
      'Webhooks salientes',
      'SLA garantizado',
      'Soporte 24/7',
    ],
    cta: 'Hablar con ventas',
    href: 'https://wa.me/543876295801',
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoIcon size={28} />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Pay Alert</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {[
              ['#features', 'Características'],
              ['#how-it-works', 'Cómo funciona'],
              ['#pricing', 'Planes'],
              ['#nosotros', 'Nosotros'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:block"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-foreground/85"
            >
              Comenzar gratis →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#040c07]">
          {/* Dot grid */}
          <div className="hero-dots absolute inset-0 opacity-60" />

          {/* Radial glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(5,150,105,0.15) 0%, transparent 70%)',
            }}
          />

          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="flex flex-col gap-14 md:flex-row md:items-center md:gap-12">

              {/* Left — copy */}
              <div className="flex-1">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-medium text-emerald-400">
                  <span className="animate-pulse-live h-1.5 w-1.5 rounded-full bg-primary" />
                  Verificado por Mercado Pago
                </div>

                <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-[3.25rem]">
                  Nunca más confíes en{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #34d399, #059669)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    comprobantes falsos
                  </span>
                  .
                </h1>

                <p className="mb-8 max-w-md text-base leading-relaxed text-white/60 md:text-[17px]">
                  Tu equipo recibe la confirmación directamente de Mercado Pago —{' '}
                  <strong className="font-semibold text-white/90">en menos de 15 segundos</strong>,
                  sin darles acceso a tu cuenta.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover"
                  >
                    Empezar gratis
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-[15px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Ver cómo funciona
                  </a>
                </div>
              </div>

              {/* Right — notification mockup */}
              <div className="flex flex-1 justify-center md:justify-end">
                <div className="relative w-full max-w-[340px]">

                  {/* Stack behind — older notifications */}
                  <div className="absolute -bottom-3 left-4 right-4 h-20 rounded-2xl border border-white/5 bg-[#0a1a10]/70 blur-[1px]" />
                  <div className="absolute -bottom-1 left-2 right-2 h-20 rounded-2xl border border-white/8 bg-[#0c1f14]/80" />

                  {/* Main notification card */}
                  <div className="relative rounded-2xl border border-emerald-900/60 bg-[#0d1f14] p-5 shadow-2xl shadow-black/60">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse-live h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs font-semibold text-emerald-400">Pay Alert</span>
                      </div>
                      <span className="text-[11px] font-mono text-white/30">ahora mismo</span>
                    </div>

                    {/* Amount */}
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/40">
                        Pago verificado
                      </p>
                      <p className="font-mono text-4xl font-bold tracking-tight text-white">
                        $15.000
                      </p>
                    </div>

                    {/* Confirmed badge */}
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-sm font-medium text-primary">
                        Confirmado por Mercado Pago
                      </p>
                    </div>

                    {/* Divider + metadata */}
                    <div className="border-t border-white/8 pt-3">
                      <p className="text-[11px] font-mono text-white/30">
                        Farmacia del Centro · Terminal QR · hace 0s
                      </p>
                    </div>
                  </div>

                  {/* Smaller previous notification below */}
                  <div className="mt-2.5 rounded-xl border border-white/8 bg-[#0a1510]/80 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-white/40">Pago verificado · hace 4 min</p>
                        <p className="mt-0.5 font-mono text-base font-semibold text-white/70">$8.500</p>
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Metrics strip */}
            <div className="mt-16 grid grid-cols-3 divide-x divide-white/8 border-t border-white/8 pt-8">
              {[
                { value: '< 15 seg', label: 'Tiempo de alerta' },
                { value: '99.9%', label: 'Uptime garantizado' },
                { value: '0', label: 'Comprobantes falsos aceptados' },
              ].map((m) => (
                <div key={m.label} className="px-6 py-2 text-center first:pl-0 last:pr-0 md:text-left">
                  <div className="font-mono text-2xl font-bold text-primary md:text-3xl">{m.value}</div>
                  <div className="mt-1 text-xs text-white/40 md:text-sm">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust bar ───────────────────────────────────────────────────── */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-4">
            {TRUST.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-muted">
                <Icon />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section id="features" className="bg-background py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                Características
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Todo lo que necesitás para proteger tu caja
              </h2>
              <p className="text-base text-muted">
                Diseñado para comercios argentinos que usan Mercado Pago y necesitan que
                su equipo opere con información verificada.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section id="how-it-works" className="border-y border-border bg-card py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                Cómo funciona
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                En marcha en minutos
              </h2>
              <p className="text-base text-muted">
                Sin instalaciones complicadas ni integraciones técnicas. Tres pasos y tu
                comercio empieza a operar con datos reales.
              </p>
            </div>

            <div className="relative grid gap-10 md:grid-cols-3">
              {/* Connector */}
              <div className="absolute top-6 hidden h-px bg-border md:block" style={{ left: '20%', right: '20%' }} />

              {STEPS.map(({ n, title, description }) => (
                <div key={n} className="relative">
                  <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-card">
                    <span className="font-mono text-sm font-bold text-primary">{n}</span>
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <section id="pricing" className="bg-background py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                Planes
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Precios claros, sin sorpresas
              </h2>
              <p className="text-base text-muted">
                En pesos argentinos. Empezás con 14 días de prueba gratis. Cancelás cuando
                querés.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl p-7 ${
                    plan.popular
                      ? 'bg-foreground text-white ring-2 ring-foreground'
                      : 'border border-border bg-card'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                        Más popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className={`mb-1 text-lg font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm ${plan.popular ? 'text-white/60' : 'text-muted'}`}>
                      {plan.desc}
                    </p>
                  </div>

                  <div className="mb-1">
                    <span className={`font-mono text-3xl font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ${plan.popular ? 'text-white/50' : 'text-muted'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>

                  <p className={`mb-6 text-xs font-medium ${plan.popular ? 'text-primary' : 'text-primary'}`}>
                    {plan.capacity}
                  </p>

                  <ul className="mb-7 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${plan.popular ? 'text-primary' : 'text-primary'}`}
                        />
                        <span className={`text-sm ${plan.popular ? 'text-white/80' : 'text-muted'}`}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={`block rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'border border-border bg-transparent text-foreground hover:bg-surface'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Nosotros ────────────────────────────────────────────────────── */}
        <section id="nosotros" className="border-y border-border bg-card py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                Nosotros
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Hecho por alguien que entiende el problema
              </h2>
              <p className="text-base text-muted">
                Pay Alert nació de una necesidad real: darle a los comerciantes argentinos
                una forma confiable de verificar pagos sin depender de capturas de pantalla.
              </p>
            </div>

            <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-16">
              {/* Card fundador */}
              <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-foreground text-xl font-bold text-white">
                    GA
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Guillermo Andrada</p>
                    <p className="text-sm text-muted">Fundador y desarrollador</p>
                    <a
                      href="https://ga-software.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      ga-software.dev
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted">
                  Desarrollador full-stack con foco en productos que resuelven problemas concretos.
                  Pay Alert es uno de ellos — construido con la misma atención al detalle que
                  aplico en cada proyecto personalizado.
                </p>
              </div>

              {/* Servicios */}
              <div className="flex-1">
                <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-muted">
                  ¿Necesitás algo a medida?
                </p>
                <h3 className="mb-4 text-xl font-bold text-foreground">
                  Desarrollo de software personalizado
                </h3>
                <p className="mb-6 text-base leading-relaxed text-muted">
                  Si tu negocio necesita una solución que no existe en el mercado,
                  puedo construirla. Desde APIs e integraciones hasta aplicaciones web
                  completas — con el mismo stack y criterio de calidad que ves acá.
                </p>
                <div className="mb-8 grid gap-3 sm:grid-cols-2">
                  {[
                    'APIs e integraciones a medida',
                    'Aplicaciones web y dashboards',
                    'Integraciones con Mercado Pago',
                    'Automatizaciones y bots',
                    'Consultoría técnica',
                    'Sistemas internos para equipos',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-muted">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
                <a
                  href="https://ga-software.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  Ver portfolio y servicios
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="bg-[#040c07] py-20">
          <div className="hero-dots relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(5,150,105,0.2) 0%, transparent 70%)',
              }}
            />
            <div className="relative mx-auto max-w-2xl px-6 py-4 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Empezá a cobrar con confianza
              </h2>
              <p className="mb-8 text-base text-white/60">
                14 días de prueba gratis, sin tarjeta de crédito.
                Cancelás cuando querés.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-[15px] font-semibold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary-hover sm:w-auto"
                >
                  Crear cuenta gratis
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <a
                  href="https://wa.me/543876295801"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-[15px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  Hablar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="mb-3 flex items-center gap-2.5">
                <LogoIcon size={24} />
                <span className="text-sm font-semibold text-foreground">Pay Alert</span>
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Plataforma de notificaciones verificadas en tiempo real para comercios que usan Mercado Pago. Producto 100% argentino.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Producto</p>
                <div className="flex flex-col gap-2">
                  {[['#features', 'Características'], ['#how-it-works', 'Cómo funciona'], ['#pricing', 'Planes']].map(([h, l]) => (
                    <a key={h} href={h} className="text-sm text-muted transition-colors hover:text-foreground">{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Acceso</p>
                <div className="flex flex-col gap-2">
                  <Link href="/login" className="text-sm text-muted transition-colors hover:text-foreground">Iniciar sesión</Link>
                  <Link href="/register" className="text-sm text-muted transition-colors hover:text-foreground">Registrarse</Link>
                  <a href="https://wa.me/543876295801" target="_blank" rel="noopener noreferrer" className="text-sm text-muted transition-colors hover:text-foreground">Soporte</a>
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Nosotros</p>
                <div className="flex flex-col gap-2">
                  <a href="#nosotros" className="text-sm text-muted transition-colors hover:text-foreground">Equipo</a>
                  <a href="https://ga-software.dev" target="_blank" rel="noopener noreferrer" className="text-sm text-muted transition-colors hover:text-foreground">ga-software.dev</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
            <p className="text-xs text-muted">© {new Date().getFullYear()} Pay Alert. Todos los derechos reservados.</p>
            <p className="text-xs text-muted">Producto argentino · Integrado con Mercado Pago · No afiliado con Mercado Libre S.A.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
