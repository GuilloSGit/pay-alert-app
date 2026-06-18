'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SlideOver } from '@/components/ui/SlideOver'
import { api, ApiError } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'
import { type MpConnection, formatDate } from './types'

export function MpConnectSection() {
  const { businessId, role } = useActiveBusiness()
  const queryClient = useQueryClient()
  const isOwner = role === 'OWNER'

  const [token, setToken] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [connectSuccess, setConnectSuccess] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [disconnectError, setDisconnectError] = useState<string | null>(null)
  const [showMpGuide, setShowMpGuide] = useState(false)

  const { data: connection, isLoading } = useQuery({
    queryKey: ['mp-connect', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<MpConnection | null>>(`/api/v1/businesses/${businessId}/mp-connect`)
        .then((r) => r.data),
    enabled: !!businessId,
  })

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setConnectError(null)
    setConnectSuccess(false)
    setIsPending(true)
    try {
      await api.post(`/api/v1/businesses/${businessId}/mp-connect`, { accessToken: token.trim() })
      setToken('')
      setConnectSuccess(true)
      void queryClient.invalidateQueries({ queryKey: ['mp-connect', businessId] })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_MP_TOKEN') {
        setConnectError('El token es inválido o no tiene los permisos necesarios. Verificá que sea el Access Token de producción.')
      } else if (err instanceof ApiError && err.code === 'MP_ACCOUNT_ALREADY_CONNECTED') {
        setConnectError(err.message)
      } else {
        setConnectError('No se pudo conectar la cuenta. Intentá de nuevo.')
      }
    } finally {
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
      <Card>
        <CardHeader>
          <CardTitle>Conexión con Mercado Pago</CardTitle>
          <CardDescription>Token de acceso para recibir notificaciones de pagos en tiempo real.</CardDescription>
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
                El token venció o fue revocado. Ingresá uno nuevo para restablecer la conexión.
              </p>
            )}

            {isOwner ? (
              <form onSubmit={handleConnect} className="flex flex-col gap-4">
                <PasswordInput
                  id="mp-access-token"
                  label="Access Token de Mercado Pago"
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setConnectError(null); setConnectSuccess(false) }}
                  placeholder="APP_USR-..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMpGuide(true)}
                  className="self-start text-xs text-primary underline underline-offset-2 transition-opacity hover:opacity-75"
                >
                  ¿Cómo obtengo el token?
                </button>

                {connectError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{connectError}</p>
                )}
                {connectSuccess && (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Cuenta de Mercado Pago conectada correctamente.
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending || !token.trim()}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" className="border-white" />
                        Verificando...
                      </span>
                    ) : isTokenExpired ? (
                      'Reconectar'
                    ) : (
                      'Conectar'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted">
                {isTokenExpired
                  ? 'La conexión con Mercado Pago está interrumpida. Contactá al propietario del comercio.'
                  : 'No hay ninguna cuenta de Mercado Pago conectada a este comercio.'}
              </p>
            )}
          </div>
        )}

        {showMpGuide && (
          <SlideOver title="Cómo conectar Mercado Pago" onClose={() => setShowMpGuide(false)}>
            <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-900">Importante</p>
                <p className="mt-1 text-sm text-amber-800">
                  Necesitás un <strong>Access Token de producción</strong>. El token de prueba (test) no funciona para cobros reales ni para recibir notificaciones.
                </p>
              </div>

              <ol className="flex flex-col gap-6">
                <li className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">Crear una aplicación en MP Developers</p>
                    <p className="text-sm text-muted">
                      Ingresá a{' '}
                      <a href="https://www.mercadopago.com.ar/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                        mercadopago.com.ar/developers/panel/app
                      </a>
                      {' '}y hacé click en <strong>Crear aplicación</strong>.
                    </p>
                    <p className="text-sm text-muted">
                      Completá el nombre (puede ser cualquiera, ej. &quot;Pay Alert&quot;) y aceptá los términos.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">Copiar el Access Token de producción</p>
                    <p className="text-sm text-muted">
                      Dentro de tu aplicación, andá a <strong>Credenciales</strong> → <strong>Producción</strong>.
                    </p>
                    <p className="text-sm text-muted">
                      Copiá el campo <strong>Access Token</strong>. Empieza con <code className="rounded bg-muted/20 px-1 font-mono text-xs">APP_USR-</code>
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">3</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">Pegarlo en Pay Alert</p>
                    <p className="text-sm text-muted">
                      Cerrá esta guía, pegá el token en el campo <strong>Access Token de Mercado Pago</strong> y hacé click en <strong>Conectar</strong>.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowMpGuide(false)}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Entendido
                </button>
              </div>
            </div>
          </SlideOver>
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
