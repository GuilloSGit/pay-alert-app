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

interface Plan {
  slug: string
  name: string
  priceARS: string
  dailySummary: boolean
  alertByAmount: boolean
  dataExport: boolean
  closures: boolean
  outboundWebhooks: boolean
  maxMembers: number
}

const PLAN_FEATURES: Record<string, string[]> = {
  basic: [
    'Notificaciones en tiempo real',
    'Historial 30 días',
    'Hasta 3 miembros',
  ],
  business: [
    'Notificaciones en tiempo real',
    'Historial completo',
    'Hasta 10 miembros',
    'Alertas por monto mínimo',
    'Exportación CSV/Excel/PDF',
    'Cierres diarios por email',
    'Webhooks salientes',
  ],
}

function PlanPicker({
  currentSlug,
  onSelect,
  loading,
  error,
}: {
  currentSlug: string
  onSelect: (slug: string) => void
  loading: boolean
  error: string | null
}) {
  const [selected, setSelected] = useState(currentSlug === 'basic' ? 'basic' : 'business')

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => api.get<{ data: Plan[] }>('/api/v1/plans').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  })

  const plans = plansData ?? []

  if (plansLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Spinner size="sm" />
        <span className="text-sm text-muted">Cargando planes...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => {
          const isSelected = selected === plan.slug
          const features = PLAN_FEATURES[plan.slug] ?? []
          return (
            <button
              key={plan.slug}
              onClick={() => setSelected(plan.slug)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                  <p className="text-xs text-muted">
                    ${Number(plan.priceARS).toLocaleString('es-AR')} / mes
                  </p>
                </div>
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected ? 'border-primary bg-primary' : 'border-border'
                  }`}
                >
                  {isSelected && (
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              {features.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted">
                      <svg className="h-3 w-3 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => onSelect(selected)}
          disabled={loading}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" className="border-white" />
              Redirigiendo...
            </span>
          ) : (
            `Suscribirme al Plan ${plans.find((p) => p.slug === selected)?.name ?? selected}`
          )}
        </button>
      </div>
    </div>
  )
}

export function SubscriptionSection() {
  const { businessId, role } = useActiveBusiness()
  const isOwner = role === 'OWNER'
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showPlanPicker, setShowPlanPicker] = useState(false)

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<SubscriptionDetail>>(`/api/v1/businesses/${businessId}/subscription`)
        .then((r) => r.data),
    enabled: !!businessId,
  })

  async function handleActivate(planSlug: string) {
    if (!businessId || !subscription) return
    setIsStartingCheckout(true)
    setCheckoutError(null)
    try {
      const res = await api.post<ApiResponse<{ checkoutUrl: string }>>(
        `/api/v1/businesses/${businessId}/subscription/checkout`,
        { planSlug },
      )
      window.location.href = res.data.checkoutUrl
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al iniciar el proceso de pago.'
      setCheckoutError(msg)
      setIsStartingCheckout(false)
    }
  }

  const needsPlanPicker = isOwner && subscription &&
    ['TRIALING', 'SUSPENDED', 'CANCELLED'].includes(subscription.status)

  const needsPaymentUpdate = isOwner && subscription && subscription.status === 'PAST_DUE'

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

            {/* PAST_DUE — instrucción clara */}
            {needsPaymentUpdate && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-800">Pago rechazado por Mercado Pago</p>
                <p className="mt-1 text-sm text-red-700">
                  Mercado Pago reintentará el cobro automáticamente. Si el problema persiste,
                  ingresá a{' '}
                  <a
                    href="https://www.mercadopago.com.ar/subscriptions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-2"
                  >
                    mercadopago.com.ar/subscriptions
                  </a>{' '}
                  para verificar o actualizar tu método de pago.
                </p>
              </div>
            )}

            {/* Plan picker — se expande al hacer click en "Activar plan" */}
            {needsPlanPicker && (
              <>
                {showPlanPicker ? (
                  <PlanPicker
                    currentSlug={subscription.plan.slug}
                    onSelect={handleActivate}
                    loading={isStartingCheckout}
                    error={checkoutError}
                  />
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowPlanPicker(true)}
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {subscription.status === 'CANCELLED' ? 'Reactivar plan' : 'Activar plan'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Cancelar — solo en ACTIVE */}
            {isOwner && subscription.status === 'ACTIVE' && (
              <div className="flex justify-end">
                <a
                  href="/dashboard/settings#cancelar"
                  className="text-xs text-muted underline underline-offset-2 hover:text-red-600"
                >
                  Cancelar suscripción
                </a>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
