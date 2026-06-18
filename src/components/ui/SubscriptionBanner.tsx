'use client'

import Link from 'next/link'
import type { SubscriptionStatus } from '@/lib/business-context'
import type { BusinessRole } from '@/types'

interface Props {
  status: SubscriptionStatus | null
  trialEndsAt: string | null
  subscriptionWarning: string | null
  role: BusinessRole | null
  businessId: string | null
  mpTokenInvalid?: boolean
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function SubscriptionBanner({ status, trialEndsAt, subscriptionWarning, role, businessId, mpTokenInvalid }: Props) {
  if (!businessId) return null

  const isOwner = role === 'OWNER'

  if (mpTokenInvalid) {
    return (
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-orange-200 bg-orange-50 px-6 py-3">
        <p className="text-sm text-orange-800">
          <span className="font-semibold">Conexión con Mercado Pago interrumpida.</span>
          {' '}Tu token venció o fue revocado — no se están recibiendo notificaciones de pagos.
        </p>
        {isOwner && (
          <Link
            href="/dashboard/settings#mp-connect"
            className="shrink-0 rounded-lg bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Reconectar →
          </Link>
        )}
      </div>
    )
  }

  if (status === 'TRIALING' && trialEndsAt) {
    const days = daysUntil(trialEndsAt)
    if (days > 7 || days <= 0) return null
    return (
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-yellow-200 bg-yellow-50 px-6 py-3">
        <p className="text-sm text-yellow-800">
          <span className="font-semibold">
            Tu prueba gratuita vence en {days} día{days !== 1 ? 's' : ''}.
          </span>
          {' '}Activá un plan para no perder el acceso.
        </p>
        {isOwner && (
          <Link
            href="/dashboard/settings#suscripcion"
            className="shrink-0 rounded-lg bg-yellow-600 px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Activar plan →
          </Link>
        )}
      </div>
    )
  }

  if (status === 'PAST_DUE' || subscriptionWarning === 'payment_overdue') {
    return (
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-red-200 bg-red-50 px-6 py-3">
        <p className="text-sm text-red-800">
          <span className="font-semibold">Pago rechazado.</span>
          {' '}
          {isOwner
            ? 'Mercado Pago reintentará el cobro. Si persiste, actualizá el método de pago desde tu cuenta de MP.'
            : 'Avisale al dueño del comercio — el pago mensual no pudo procesarse.'}
        </p>
        {isOwner && (
          <a
            href="https://www.mercadopago.com.ar/subscriptions"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ver en MP →
          </a>
        )}
      </div>
    )
  }

  return null
}
