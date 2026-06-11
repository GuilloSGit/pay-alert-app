import Link from 'next/link'

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#059669" />
      <path d="M16 6a2 2 0 0 0-2 2v.87A6 6 0 0 0 10 15v4l-1.5 1.5V21h15v-.5L22 19v-4a6 6 0 0 0-4-5.87V8a2 2 0 0 0-2-2z" fill="white" />
      <path d="M13.5 21a2.5 2.5 0 0 0 5 0h-5z" fill="white" />
    </svg>
  )
}

const VALUE_PROPS = [
  'Alertas verificadas directas de Mercado Pago',
  'Tu equipo recibe notificaciones sin acceso a tu cuenta',
  'Menos de 15 segundos desde el pago a la alerta',
  'Roles y permisos — vos decidís quién ve qué',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">

      {/* ── Left panel — brand ───────────────────────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#040c07] p-10 md:flex md:w-[52%]">
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(5,150,105,0.15) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(5,150,105,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <LogoIcon />
          <span className="text-base font-semibold text-white">Pay Alert</span>
        </div>

        {/* Main content */}
        <div className="relative max-w-sm">
          {/* Live indicator */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-800/50 bg-emerald-950/50 px-3 py-1.5 text-xs text-emerald-400">
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary"
              style={{ animation: 'pulse-live 2s ease-in-out infinite' }}
            />
            Sistema operativo · 99.9% uptime
          </div>

          <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-white">
            Cada venta,<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #34d399, #059669)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              confirmada al instante.
            </span>
          </h2>

          <p className="mb-8 text-sm leading-relaxed text-white/50">
            Verificación real de pagos de Mercado Pago para vos y tu equipo.
          </p>

          <ul className="space-y-3">
            {VALUE_PROPS.map((prop) => (
              <li key={prop} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-white/70">{prop}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-xs text-white/30">
            Integración oficial con Mercado Pago · Encriptación E2E · Producto argentino
          </p>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo (only visible < md) */}
        <div className="mb-8 flex flex-col items-center gap-2 md:hidden">
          <LogoIcon />
          <span className="text-base font-semibold text-foreground">Pay Alert</span>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>

        <Link
          href="/"
          className="mt-8 flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al inicio
        </Link>
      </div>

    </div>
  )
}
