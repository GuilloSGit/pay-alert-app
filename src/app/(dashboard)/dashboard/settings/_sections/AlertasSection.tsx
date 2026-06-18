'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'
import { type NotificationRule } from './types'

interface AlertasSubscription {
  plan: { alertByAmount: boolean }
}

export function AlertasSection() {
  const { businessId, role } = useActiveBusiness()
  const queryClient = useQueryClient()
  const canEdit = role === 'OWNER' || role === 'ADMIN'

  const { data: subscription, isLoading: isLoadingSub } = useQuery({
    queryKey: ['subscription-alertas', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<AlertasSubscription>>(`/api/v1/businesses/${businessId}/subscription`)
        .then((r) => r.data),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: rule, isLoading: isLoadingRule } = useQuery({
    queryKey: ['notification-rules', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<NotificationRule | null>>(`/api/v1/businesses/${businessId}/notification-rules`)
        .then((r) => r.data),
    enabled: !!businessId && !!subscription?.plan.alertByAmount,
  })

  const [minAmount, setMinAmount] = useState<string>('')
  const [initialized, setInitialized] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (rule !== undefined && !initialized) {
    setMinAmount(rule?.minAmount != null ? String(rule.minAmount) : '')
    setInitialized(true)
  }

  const hasAlertByAmount = !!subscription?.plan.alertByAmount
  const isLoading = isLoadingSub || (hasAlertByAmount && isLoadingRule)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      const parsed = minAmount.trim() === '' ? null : Number(minAmount)
      if (parsed !== null && (isNaN(parsed) || parsed <= 0)) {
        setError('Ingresá un monto válido mayor a 0.')
        return
      }
      await api.put(`/api/v1/businesses/${businessId}/notification-rules`, { minAmount: parsed })
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
        <CardTitle>Alertas de pagos</CardTitle>
        <CardDescription>Configurá cuándo recibir notificaciones.</CardDescription>
      </CardHeader>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      ) : !hasAlertByAmount ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-sm font-medium text-foreground">Disponible en el plan Business</p>
          <p className="mt-1 text-sm text-muted">
            Filtrá notificaciones por monto mínimo y recibí alertas solo de los pagos que importan.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="min-amount" className="text-sm font-medium text-foreground">
              Monto mínimo para notificar (ARS)
            </label>
            <p className="text-xs text-muted">
              Solo recibirás notificaciones de pagos iguales o mayores a este monto. Dejarlo vacío notifica todos los pagos.
            </p>
            <input
              id="min-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); setSuccess(false) }}
              placeholder="Ej: 1000"
              disabled={!canEdit}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

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
