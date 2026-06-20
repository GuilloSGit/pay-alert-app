'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { api, ApiError } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'
import { type MpConnection, formatDate } from './types'

const MP_ERROR_MESSAGES: Record<string, string> = {
  cancelled: 'Cancelaste la autorización en Mercado Pago.',
  already_connected: 'Esta cuenta de Mercado Pago ya está conectada a otro comercio.',
  token_exchange_failed: 'Hubo un error al obtener los tokens de Mercado Pago. Intentá de nuevo.',
  invalid_state: 'El enlace de autorización expiró. Intentá de nuevo.',
  not_configured: 'OAuth de MP no configurado. Contactá a soporte.',
}

function MpCallbackHandler({
  businessId,
  setOauthSuccess,
  setOauthError,
}: {
  businessId: string | null
  setOauthSuccess: (v: boolean) => void
  setOauthError: (v: string | null) => void
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    const mp = searchParams.get('mp')
    const mpError = searchParams.get('mp_error')
    if (!mp) return

    if (mp === 'connected') {
      setOauthSuccess(true)
      void queryClient.invalidateQueries({ queryKey: ['mp-connect', businessId] })
    } else if (mp === 'error') {
      setOauthError(MP_ERROR_MESSAGES[mpError ?? ''] ?? 'Error al conectar con Mercado Pago.')
    }

    const url = new URL(window.location.href)
    url.searchParams.delete('mp')
    url.searchParams.delete('mp_error')
    url.searchParams.delete('businessId')
    router.replace(url.pathname + (url.search || ''), { scroll: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export function MpConnectSection() {
  const { businessId, role } = useActiveBusiness()
  const queryClient = useQueryClient()
  const isOwner = role === 'OWNER'

  const [isPending, setIsPending] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [oauthSuccess, setOauthSuccess] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [disconnectError, setDisconnectError] = useState<string | null>(null)

  const { data: connection, isLoading } = useQuery({
    queryKey: ['mp-connect', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<MpConnection | null>>(`/api/v1/businesses/${businessId}/mp-connect`)
        .then((r) => r.data),
    enabled: !!businessId,
  })

  async function handleOAuth() {
    if (!businessId) return
    setIsPending(true)
    setOauthError(null)
    setOauthSuccess(false)
    try {
      const res = await api.get<ApiResponse<{ url: string }>>(
        `/api/v1/businesses/${businessId}/mp-connect/oauth?returnTo=/dashboard/settings`,
      )
      window.location.href = res.data.url
    } catch {
      setOauthError('No se pudo iniciar la conexión. Intentá de nuevo.')
      setIsPending(false)
    }
  }

  async function handleDisconnect() {
    setIsDisconnecting(true)
    setDisconnectError(null)
    try {
      await api.delete(`/api/v1/businesses/${businessId}/mp-connect`)
      void queryClient.invalidateQueries({ queryKey: ['mp-connect', businessId] })
      setShowDisconnect(false)
    } catch {
      setDisconnectError('No se pudo desconectar. Intentá de nuevo.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const isConnected = !!connection && connection.isActive
  const isTokenExpired = !!connection && !connection.isActive

  return (
    <div id="mp-connect">
      <Suspense fallback={null}>
        <MpCallbackHandler businessId={businessId} setOauthSuccess={setOauthSuccess} setOauthError={setOauthError} />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle>Conexión con Mercado Pago</CardTitle>
          <CardDescription>
            Autorizá a Pay Alert para recibir notificaciones de tus pagos en tiempo real.
          </CardDescription>
        </CardHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Spinner size="sm" />
            <span className="text-sm text-muted">Cargando...</span>
          </div>
        ) : isConnected ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Cuenta conectada</p>
                <p className="text-xs text-muted">ID MP: {connection.mpUserId}</p>
                <p className="text-xs text-muted">Desde el {formatDate(connection.connectedAt)}</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Activo
              </span>
            </div>
            {oauthSuccess && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Cuenta de Mercado Pago conectada correctamente.
              </p>
            )}
            {isOwner && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDisconnect(true)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Desconectar cuenta
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {isTokenExpired && (
              <p className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                La conexión con Mercado Pago se interrumpió. Volvé a autorizar para restablecer las notificaciones.
              </p>
            )}

            {oauthSuccess && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Cuenta de Mercado Pago conectada correctamente.
              </p>
            )}

            {oauthError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {oauthError}
              </p>
            )}

            {isOwner ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleOAuth}
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#009EE3] bg-[#009EE3] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Spinner size="sm" className="border-white" />
                      Redirigiendo...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="white" />
                        <path d="M8.5 20.5c.7 1.2 2 2 3.5 2h7c1.5 0 2.8-.8 3.5-2l2-3.5c.3-.5.5-1.1.5-1.7V13c0-2.2-1.8-4-4-4h-4l-1.5 2.5H17c.8 0 1.5.7 1.5 1.5S17.8 14.5 17 14.5h-1l-1.5 2.5h2.5c.8 0 1.5.7 1.5 1.5S17.8 20 17 20h-5c-.5 0-1-.2-1.3-.5L8.5 20.5z" fill="#009EE3" />
                      </svg>
                      {isTokenExpired ? 'Reconectar con Mercado Pago' : 'Conectar con Mercado Pago'}
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted">
                  Serás redirigido a Mercado Pago para autorizar el acceso. No compartimos ni almacenamos tu contraseña.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">
                {isTokenExpired
                  ? 'La conexión con Mercado Pago está interrumpida. Contactá al propietario del comercio.'
                  : 'No hay ninguna cuenta de Mercado Pago conectada a este comercio.'}
              </p>
            )}
          </div>
        )}

        {showDisconnect && (
          <ConfirmDialog
            title="Desconectar Mercado Pago"
            description="Dejará de recibirse notificaciones de pagos hasta que vuelvas a conectar una cuenta."
            icon={
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            }
            confirmLabel="Desconectar"
            pendingLabel="Desconectando..."
            onConfirm={handleDisconnect}
            onCancel={() => { setShowDisconnect(false); setDisconnectError(null) }}
            isPending={isDisconnecting}
          >
            {disconnectError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {disconnectError}
              </p>
            )}
          </ConfirmDialog>
        )}
      </Card>
    </div>
  )
}
