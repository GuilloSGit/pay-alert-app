'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import type { ApiResponse } from '@/types'

const POLL_INTERVAL = 3000
const POLL_TIMEOUT = 45000

interface SubscriptionStatus {
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'
}

function ResultContent() {
  const router = useRouter()
  const params = useSearchParams()
  const businessId = params.get('businessId')

  const [state, setState] = useState<'polling' | 'active' | 'timeout' | 'no_business'>(() =>
    businessId ? 'polling' : 'no_business',
  )

  useEffect(() => {
    if (!businessId) return

    let stopped = false
    const deadline = Date.now() + POLL_TIMEOUT

    async function poll() {
      try {
        const res = await api.get<ApiResponse<SubscriptionStatus>>(
          `/api/v1/businesses/${businessId}/subscription`,
        )
        if (res.data.status === 'ACTIVE') {
          if (!stopped) setState('active')
          return
        }
      } catch {
        // continuar polleando
      }

      if (!stopped) {
        if (Date.now() >= deadline) {
          setState('timeout')
        } else {
          setTimeout(poll, POLL_INTERVAL)
        }
      }
    }

    void poll()
    return () => { stopped = true }
  }, [businessId])

  // Activo confirmado
  if (state === 'active') {
    return (
      <>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">¡Suscripción activa!</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Tu plan está activo. En breve recibirás un email de confirmación.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-8 inline-block rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Ir al dashboard →
        </button>
      </>
    )
  }

  // Timeout: MP no confirmó en 45s (webhook puede demorar más)
  if (state === 'timeout') {
    return (
      <>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Procesando pago</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Mercado Pago está procesando tu pago. Esto puede tomar unos minutos.
          Recibirás un email cuando tu suscripción esté activa.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Volver al dashboard
        </Link>
      </>
    )
  }

  // Sin businessId — acceso directo a la URL
  if (state === 'no_business') {
    return (
      <>
        <h1 className="text-2xl font-bold text-foreground">Procesando</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Si completaste el pago, en breve recibirás un email de confirmación.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Ir al dashboard
        </Link>
      </>
    )
  }

  // Polling en curso
  return (
    <>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Spinner size="md" className="border-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Procesando pago</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Estamos confirmando tu suscripción con Mercado Pago…
      </p>
    </>
  )
}

export default function SuscripcionResultadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-4">
              <Spinner size="md" />
              <p className="text-sm text-muted">Verificando…</p>
            </div>
          }
        >
          <ResultContent />
        </Suspense>
      </div>
    </div>
  )
}
