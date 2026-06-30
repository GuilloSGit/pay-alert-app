'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
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

interface Plan {
  slug: string
  name: string
  priceARS: string | null
  isPublic: boolean
  alertByAmount: boolean
  dataExport: boolean
  closures: boolean
  outboundWebhooks: boolean
  apiKeys: boolean
  maxMembers: number
  maxBusinesses: number
}

const PLAN_FEATURES: Record<string, string[]> = {
  basic: [
    'Notificaciones en tiempo real',
    'Historial 30 días',
    '1 comercio · hasta 3 miembros',
  ],
  professional: [
    'Notificaciones en tiempo real',
    'Historial 1 año',
    '2 comercios · hasta 6 miembros',
    'Alertas por monto mínimo',
    'Exportación CSV',
    'Cierres por email (diario/semanal/mensual)',
    'Webhooks salientes',
  ],
}

const RECOMMENDED_SLUG = 'professional'

export function SubscriptionSection() {
  const { businessId, role } = useActiveBusiness()
  const queryClient = useQueryClient()
  const isOwner = role === 'OWNER'

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const { data: subscription, isLoading: isLoadingSub } = useQuery({
    queryKey: ['subscription', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<SubscriptionDetail>>(`/api/v1/businesses/${businessId}/subscription`)
        .then((r) => r.data),
    enabled: !!businessId,
  })

  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => api.get<{ data: Plan[] }>('/api/v1/plans').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
    enabled: !!businessId && isOwner,
  })

  const plans = (plansData ?? []).filter((p) => p.isPublic)

  async function handleCheckout(planSlug: string) {
    if (!businessId || !subscription) return
    setCheckoutLoading(planSlug)
    setCheckoutError(null)
    try {
      const res = await api.post<ApiResponse<{ checkoutUrl: string }>>(
        `/api/v1/businesses/${businessId}/subscription/checkout`,
        { planSlug },
      )
      window.location.href = res.data.checkoutUrl
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : 'Error al iniciar el proceso de pago.')
      setCheckoutLoading(null)
    }
  }

  async function handleCancelSubscription() {
    if (!businessId) return
    setIsCancelling(true)
    setCancelError(null)
    try {
      await api.delete(`/api/v1/businesses/${businessId}/subscription`)
      void queryClient.invalidateQueries({ queryKey: ['subscription', businessId] })
      setShowCancelConfirm(false)
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : 'No se pudo cancelar. Intentá de nuevo.')
    } finally {
      setIsCancelling(false)
    }
  }

  const isLoading = isLoadingSub || isLoadingPlans

  return (
    <div id="suscripcion" className="space-y-5">
      {/* Header de sección */}
      <div className="border-b border-border pb-2">
        <h2 className="text-base font-semibold text-foreground">Suscripción</h2>
        <p className="text-xs text-muted">Estado actual y planes disponibles.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      ) : !subscription ? (
        <p className="text-sm text-muted">No se pudo cargar la suscripción.</p>
      ) : (
        <>
          {/* Estado actual */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <p className="text-xs text-muted">Plan actual</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{subscription.plan.name}</p>
              <p className="text-xs text-muted">
                {subscription.status === 'TRIALING' && subscription.trialEndsAt
                  ? daysUntil(subscription.trialEndsAt) > 0
                    ? `Prueba gratuita — vence en ${daysUntil(subscription.trialEndsAt)} días (${formatDate(subscription.trialEndsAt)})`
                    : 'Período de prueba finalizado'
                  : subscription.status === 'ACTIVE'
                  ? `Próxima renovación: ${formatDate(subscription.currentPeriodEnd)}`
                  : subscription.status === 'CANCELLED' && subscription.cancelledAt
                  ? `Cancelada el ${formatDate(subscription.cancelledAt)}`
                  : ''}
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${SUBSCRIPTION_STATUS_COLORS[subscription.status]}`}>
              {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
            </span>
          </div>

          {/* Aviso PAST_DUE */}
          {subscription.status === 'PAST_DUE' && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">Pago rechazado por Mercado Pago</p>
              <p className="mt-1 text-sm text-red-700">
                MP reintentará el cobro automáticamente. Si persiste, revisá tu método de pago en{' '}
                <a
                  href="https://www.mercadopago.com.ar/subscriptions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2"
                >
                  mercadopago.com.ar/subscriptions
                </a>.
              </p>
            </div>
          )}

          {/* Grilla de planes — solo OWNER */}
          {isOwner && plans.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Planes disponibles</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((plan) => {
                  const isCurrent = plan.slug === subscription.plan.slug
                  const isRecommended = plan.slug === RECOMMENDED_SLUG
                  const features = PLAN_FEATURES[plan.slug] ?? []
                  const canSwitch = !isCurrent && ['TRIALING', 'ACTIVE', 'SUSPENDED', 'CANCELLED'].includes(subscription.status)
                  const actionLabel = isCurrent
                    ? null
                    : subscription.status === 'ACTIVE'
                    ? `Cambiar a ${plan.name}`
                    : `Activar ${plan.name}`

                  return (
                    <div
                      key={plan.slug}
                      className={`relative flex flex-col rounded-xl border-2 p-4 transition-colors ${
                        isCurrent
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      {/* Badges */}
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                        {isCurrent && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Actual
                          </span>
                        )}
                        {isRecommended && !isCurrent && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                            Recomendado
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-primary">
                        {plan.priceARS !== null
                          ? `$${Number(plan.priceARS).toLocaleString('es-AR')} / mes`
                          : 'A medida'}
                      </p>

                      {features.length > 0 && (
                        <ul className="mt-3 flex-1 space-y-1.5">
                          {features.map((f) => (
                            <li key={f} className="flex items-start gap-1.5 text-xs text-muted">
                              <svg className="mt-px h-3 w-3 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      {canSwitch && actionLabel && (
                        <button
                          onClick={() => handleCheckout(plan.slug)}
                          disabled={checkoutLoading !== null}
                          className="mt-4 w-full rounded-lg border border-primary bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
                        >
                          {checkoutLoading === plan.slug ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Spinner size="sm" />
                              Redirigiendo...
                            </span>
                          ) : (
                            actionLabel
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Enterprise — siempre al final */}
                <div className="flex flex-col rounded-xl border-2 border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Enterprise</p>
                  </div>
                  <p className="text-sm font-semibold text-muted">A medida</p>
                  <ul className="mt-3 flex-1 space-y-1.5">
                    {['Comercios y miembros ilimitados', 'API Keys', 'Webhooks salientes', 'Soporte prioritario'].map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-muted">
                        <svg className="mt-px h-3 w-3 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="mailto:soporte@pay-alert.com.ar?subject=Consulta%20Enterprise"
                    className="mt-4 w-full rounded-lg border border-border px-3 py-1.5 text-center text-xs font-semibold text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    Contactar →
                  </a>
                </div>
              </div>

              {checkoutError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {checkoutError}
                </p>
              )}
            </div>
          )}

          {/* Cancelar suscripción — solo ACTIVE, al fondo */}
          {isOwner && subscription.status === 'ACTIVE' && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-muted underline underline-offset-2 hover:text-red-600"
              >
                Cancelar suscripción
              </button>
            </div>
          )}
        </>
      )}

      {showCancelConfirm && subscription && (
        <ConfirmDialog
          title="Cancelar suscripción"
          description={
            <>
              ¿Confirmás la cancelación del Plan{' '}
              <strong className="text-foreground">{subscription.plan.name}</strong>?
              Perderás el acceso al finalizar el período actual. Tus datos e historial se conservan y podés reactivar cuando quieras.
            </>
          }
          icon={
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          confirmLabel="Sí, cancelar"
          pendingLabel="Cancelando..."
          onConfirm={handleCancelSubscription}
          onCancel={() => { setShowCancelConfirm(false); setCancelError(null) }}
          isPending={isCancelling}
        >
          {cancelError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {cancelError}
            </p>
          )}
        </ConfirmDialog>
      )}
    </div>
  )
}
