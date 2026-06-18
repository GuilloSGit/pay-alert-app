'use client'

import Link from 'next/link'
import type { SubscriptionStatus } from '@/lib/business-context'
import type { BusinessRole } from '@/types'

interface Props {
  status: SubscriptionStatus | null
  role: BusinessRole | null
}

export function SubscriptionGate({ status, role }: Props) {
  if (status !== 'SUSPENDED' && status !== 'CANCELLED') return null

  const isOwner = role === 'OWNER'
  const isCancelled = status === 'CANCELLED'

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-7 w-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-foreground">
          {isCancelled ? 'Suscripción cancelada' : 'Acceso suspendido'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {isCancelled
            ? 'Cancelaste tu suscripción. Podés reactivarla cuando quieras sin perder tus datos ni historial.'
            : 'Tu cuenta fue suspendida por falta de pago o vencimiento del período de prueba. Tus datos e historial están guardados.'}
        </p>

        {isOwner ? (
          <Link
            href="/dashboard/settings#suscripcion"
            className="mt-6 inline-block rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {isCancelled ? 'Reactivar plan' : 'Reactivar acceso'}
          </Link>
        ) : (
          <p className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-sm text-muted">
            Contactá al dueño del comercio para reactivar el acceso.
          </p>
        )}
      </div>
    </div>
  )
}
