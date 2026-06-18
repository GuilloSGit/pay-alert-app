'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { api, ApiError } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'
import {
  type SubscriptionDetail,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  formatDate,
  daysUntil,
} from './types'

export function SubscriptionSection() {
  const { businessId, role } = useActiveBusiness()
  const isOwner = role === 'OWNER'
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<SubscriptionDetail>>(`/api/v1/businesses/${businessId}/subscription`)
        .then((r) => r.data),
    enabled: !!businessId,
  })

  async function handleActivate() {
    if (!businessId || !subscription) return
    setIsStartingCheckout(true)
    setCheckoutError(null)
    try {
      const res = await api.post<ApiResponse<{ checkoutUrl: string }>>(
        `/api/v1/businesses/${businessId}/subscription/checkout`,
        { planSlug: subscription.plan.slug },
      )
      window.location.href = res.data.checkoutUrl
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al iniciar el proceso de pago.'
      setCheckoutError(msg)
      setIsStartingCheckout(false)
    }
  }

  const showActivateButton =
    isOwner &&
    subscription &&
    ['TRIALING', 'SUSPENDED', 'CANCELLED', 'PAST_DUE'].includes(subscription.status)

  return (
    <div id="suscripcion">
      <Card>
        <CardHeader>
          <CardTitle>Suscripción</CardTitle>
          <CardDescription>Estado y plan de tu comercio.</CardDescription>
        </CardHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Spinner size="sm" />
            <span className="text-sm text-muted">Cargando...</span>
          </div>
        ) : !subscription ? (
          <p className="text-sm text-muted">No se pudo cargar la suscripción.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{subscription.plan.name}</p>
                <p className="text-xs text-muted">
                  {subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE'
                    ? `$${Number(subscription.plan.priceARS).toLocaleString('es-AR')} / mes`
                    : subscription.status === 'TRIALING'
                    ? `${subscription.plan.trialDays} días de prueba gratuita`
                    : '—'}
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${SUBSCRIPTION_STATUS_COLORS[subscription.status]}`}>
                {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
              </span>
            </div>

            {subscription.status === 'TRIALING' && subscription.trialEndsAt && (
              <p className="text-sm text-muted">
                {daysUntil(subscription.trialEndsAt) > 0
                  ? `Vence en ${daysUntil(subscription.trialEndsAt)} días — ${formatDate(subscription.trialEndsAt)}`
                  : 'El período de prueba finalizó.'}
              </p>
            )}

            {subscription.status === 'ACTIVE' && (
              <p className="text-sm text-muted">
                Próxima renovación: {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}

            {subscription.status === 'CANCELLED' && subscription.cancelledAt && (
              <p className="text-sm text-muted">
                Cancelada el {formatDate(subscription.cancelledAt)}
              </p>
            )}

            {checkoutError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {checkoutError}
              </p>
            )}

            {showActivateButton && (
              <div className="flex justify-end">
                <button
                  onClick={handleActivate}
                  disabled={isStartingCheckout}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isStartingCheckout ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" className="border-white" />
                      Redirigiendo...
                    </span>
                  ) : subscription.status === 'CANCELLED' ? (
                    'Reactivar plan'
                  ) : subscription.status === 'PAST_DUE' ? (
                    'Actualizar método de pago'
                  ) : (
                    'Activar plan'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
