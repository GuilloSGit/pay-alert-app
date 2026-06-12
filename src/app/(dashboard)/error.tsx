'use client'

import { useEffect } from 'react'
import Link from 'next/link'

function BellIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 6a2 2 0 0 0-2 2v.87A6 6 0 0 0 10 15v4l-1.5 1.5V21h15v-.5L22 19v-4a6 6 0 0 0-4-5.87V8a2 2 0 0 0-2-2z" fill="white" fillOpacity={0.9} />
      <path d="M13.5 21a2.5 2.5 0 0 0 5 0h-5z" fill="white" fillOpacity={0.9} />
    </svg>
  )
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background p-8">

      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(5,150,105,0.18) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(5,150,105,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="animate-fade-up relative flex flex-col items-center gap-8 text-center" style={{ animationDelay: '0ms' }}>

        {/* Logo + alert badge */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-dark shadow-2xl ring-4 ring-primary/20">
            <BellIcon />
          </div>
          {/* Exclamation badge */}
          <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 shadow-lg ring-2 ring-white">
            <span className="text-sm font-black text-amber-900">!</span>
          </div>
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Algo salió mal
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Esta página tuvo un error inesperado. Podés reintentar o volver al inicio — tu historial de pagos está intacto.
          </p>
        </div>

        {/* Error digest for debugging */}
        {error.digest && (
          <div className="rounded-lg border border-border bg-surface px-4 py-2">
            <span className="font-mono text-xs text-muted">ref: {error.digest}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-primary/40 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ir al dashboard
          </Link>
        </div>

        {/* Tagline */}
        <p className="text-xs text-muted/60">
          Pay Alert · Tu historial de cobros siempre disponible
        </p>
      </div>
    </div>
  )
}
