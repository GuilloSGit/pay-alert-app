'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from './Spinner'
import { api } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'

interface MpConnection {
  mpUserId: string
  isActive: boolean
}

export function NoMpConnectionBanner() {
  const { businessId, role } = useActiveBusiness()
  const isOwner = role === 'OWNER'
  const [isPending, setIsPending] = useState(false)

  const { data: connection, isLoading } = useQuery({
    queryKey: ['mp-connect', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<MpConnection | null>>(`/api/v1/businesses/${businessId}/mp-connect`)
        .then((r) => r.data),
    enabled: !!businessId,
    staleTime: 60_000,
  })

  // MP conectado y activo → no mostrar nada
  if (isLoading || (connection && connection.isActive)) return null

  async function handleOAuth() {
    if (!businessId) return
    setIsPending(true)
    try {
      const res = await api.get<ApiResponse<{ url: string }>>(
        `/api/v1/businesses/${businessId}/mp-connect/oauth?returnTo=/dashboard`,
      )
      window.location.href = res.data.url
    } catch {
      setIsPending(false)
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100">
            <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-orange-900">
              {connection && !connection.isActive
                ? 'Conexión con Mercado Pago interrumpida'
                : 'Mercado Pago no está conectado'}
            </p>
            <p className="mt-0.5 text-sm text-orange-700">
              {connection && !connection.isActive
                ? 'Las alertas de cobros están pausadas. Volvé a autorizar para reactivarlas.'
                : 'Sin una cuenta de Mercado Pago vinculada, Pay Alert no puede notificarte sobre tus cobros.'}
            </p>
          </div>
        </div>

        {isOwner ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={handleOAuth}
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#009EE3] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? (
                <><Spinner size="sm" className="border-white" />Redirigiendo...</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="16" fill="white" />
                    <path d="M8.5 20.5c.7 1.2 2 2 3.5 2h7c1.5 0 2.8-.8 3.5-2l2-3.5c.3-.5.5-1.1.5-1.7V13c0-2.2-1.8-4-4-4h-4l-1.5 2.5H17c.8 0 1.5.7 1.5 1.5S17.8 14.5 17 14.5h-1l-1.5 2.5h2.5c.8 0 1.5.7 1.5 1.5S17.8 20 17 20h-5c-.5 0-1-.2-1.3-.5L8.5 20.5z" fill="#009EE3" />
                  </svg>
                  {connection && !connection.isActive ? 'Reconectar' : 'Conectar ahora'}
                </>
              )}
            </button>
            <Link
              href="/onboarding"
              className="text-center text-sm font-medium text-orange-700 underline-offset-2 hover:underline"
            >
              Usar el asistente →
            </Link>
          </div>
        ) : (
          <p className="shrink-0 text-sm text-orange-700">
            Avisale al propietario del comercio.
          </p>
        )}
      </div>
    </div>
  )
}
