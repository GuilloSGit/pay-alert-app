'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'
import { type NotificationRule } from './types'

const CLOSURE_FREQ_OPTIONS = [
  { value: 'daily',   label: 'Diario (resumen de cada día)' },
  { value: 'weekly',  label: 'Semanal (los lunes, semana anterior)' },
  { value: 'monthly', label: 'Mensual (el 1° de cada mes, mes anterior)' },
  { value: 'never',   label: 'Nunca' },
] as const

const CLOSURE_HOUR_OPTIONS = [
  { value: 0,  label: '00:00 (medianoche)' },
  { value: 6,  label: '06:00 (madrugada)' },
  { value: 12, label: '12:00 (mediodía)' },
  { value: 18, label: '18:00 (tarde)' },
] as const

interface CierresSubscription {
  plan: { closures: boolean; name: string }
}

export function CierresEmailSection() {
  const { businessId, role } = useActiveBusiness()
  const queryClient = useQueryClient()
  const canEdit = role === 'OWNER' || role === 'ADMIN'

  const { data: subscription, isLoading: isLoadingSub } = useQuery({
    queryKey: ['subscription-cierres', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<CierresSubscription>>(`/api/v1/businesses/${businessId}/subscription`)
        .then((r) => r.data),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  })

  const hasClosures = !!subscription?.plan.closures

  const { data: rule, isLoading: isLoadingRule } = useQuery({
    queryKey: ['notification-rules', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<NotificationRule | null>>(`/api/v1/businesses/${businessId}/notification-rules`)
        .then((r) => r.data),
    enabled: !!businessId && hasClosures,
  })

  const [freq, setFreq] = useState<string>('daily')
  const [hour, setHour] = useState<number>(0)
  const [initialized, setInitialized] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (rule !== undefined && !initialized) {
    setFreq(rule?.closureEmailFrequency ?? 'daily')
    setHour(rule?.closureEmailHour ?? 0)
    setInitialized(true)
  }

  const isLoading = isLoadingSub || (hasClosures && isLoadingRule)
  const showHourPicker = freq !== 'never'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      await api.put(`/api/v1/businesses/${businessId}/notification-rules`, {
        closureEmailFrequency: freq,
        ...(showHourPicker && { closureEmailHour: hour }),
      })
      void queryClient.invalidateQueries({ queryKey: ['notification-rules', businessId] })
      setSuccess(true)
    } catch {
      setError('No se pudo guardar la configuración. Intentá de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cierres por email</CardTitle>
        <CardDescription>Recibí un resumen de cada cierre con el desglose por método de pago.</CardDescription>
      </CardHeader>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      ) : !hasClosures ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-sm font-medium text-foreground">Disponible en el plan Profesional</p>
          <p className="mt-1 text-sm text-muted">
            Recibí el cierre diario, semanal o mensual de tu comercio directamente en tu email.
          </p>
          <a
            href="#suscripcion"
            className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-2"
          >
            Ver planes →
          </a>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="closure-freq" className="text-sm font-medium text-foreground">
                Frecuencia
              </label>
              <select
                id="closure-freq"
                value={freq}
                onChange={(e) => { setFreq(e.target.value); setSuccess(false) }}
                disabled={!canEdit}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {CLOSURE_FREQ_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {showHourPicker && (
              <div className="flex flex-1 flex-col gap-1">
                <label htmlFor="closure-hour" className="text-sm font-medium text-foreground">
                  Horario de envío (ART)
                </label>
                <select
                  id="closure-hour"
                  value={hour}
                  onChange={(e) => { setHour(Number(e.target.value)); setSuccess(false) }}
                  disabled={!canEdit}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {CLOSURE_HOUR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p className="text-xs text-muted">
            El email llega al OWNER y ADMIN del comercio con el total y el desglose por método de pago.
          </p>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Configuración guardada correctamente.
            </p>
          )}

          {canEdit && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" className="border-white" />
                    Guardando...
                  </span>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          )}
        </form>
      )}
    </Card>
  )
}
