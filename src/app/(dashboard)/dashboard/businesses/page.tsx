'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { api, ApiError } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { Business, ApiResponse } from '@/types'

interface MpConnection {
  mpUserId: string
  isActive: boolean
  connectedAt: string
  lastVerifiedAt: string | null
}

interface MpConnectionResponse {
  data: MpConnection | null
}

interface BusinessResponse {
  data: Business
}

interface SubscriptionInfo {
  planName: string
  planSlug: string
  status: string
  currentPeriodEnd: string
  trialEndsAt: string | null
}

interface SummaryResponse {
  data: { subscription: SubscriptionInfo | null }
}

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  TRIALING: 'Período de prueba',
  ACTIVE: 'Activo',
  PAST_DUE: 'Pago pendiente',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function BusinessesPage() {
  const { businessId, role } = useActiveBusiness()
  const isOwner = role === 'OWNER'
  const isManager = role === 'OWNER' || role === 'ADMIN'

  const [business, setBusiness] = useState<Business | null>(null)
  const [mpConnection, setMpConnection] = useState<MpConnection | null | undefined>(undefined)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // MP connect state
  const [isConnecting, setIsConnecting] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [isSubmittingToken, setIsSubmittingToken] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  useEffect(() => {
    if (!businessId) return

    Promise.all([
      api.get<BusinessResponse>(`/api/v1/businesses/${businessId}`),
      api.get<MpConnectionResponse>(`/api/v1/businesses/${businessId}/mp-connect`),
      api.get<SummaryResponse>(`/api/v1/businesses/${businessId}/summary`),
    ])
      .then(([bizRes, mpRes, summaryRes]) => {
        setBusiness(bizRes.data)
        setMpConnection(mpRes.data)
        setSubscription(summaryRes.data.subscription)
      })
      .catch(() => {
        setMpConnection(null)
        setSubscription(null)
      })
      .finally(() => setIsLoading(false))
  }, [businessId])

  function startEdit() {
    if (!business) return
    setEditName(business.name)
    setEditDescription(business.description ?? '')
    setEditCategory(business.category ?? '')
    setEditError(null)
    setIsEditing(true)
  }

  async function saveEdit() {
    if (!businessId || !business) return
    setIsSaving(true)
    setEditError(null)
    try {
      const res = await api.put<BusinessResponse>(`/api/v1/businesses/${businessId}`, {
        name: editName.trim() || business.name,
        description: editDescription.trim() || undefined,
        category: editCategory.trim() || undefined,
      })
      setBusiness(res.data)
      setIsEditing(false)
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  async function connectMp() {
    if (!businessId || !accessToken.trim()) return
    setIsSubmittingToken(true)
    setTokenError(null)
    try {
      const res = await api.post<ApiResponse<MpConnection>>(`/api/v1/businesses/${businessId}/mp-connect`, {
        accessToken: accessToken.trim(),
      })
      setMpConnection(res.data)
      setAccessToken('')
      setIsConnecting(false)
    } catch (e) {
      setTokenError(e instanceof ApiError ? e.message : 'Error al conectar')
    } finally {
      setIsSubmittingToken(false)
    }
  }

  async function disconnectMp() {
    if (!businessId) return
    setIsDisconnecting(true)
    try {
      await api.delete(`/api/v1/businesses/${businessId}/mp-connect`)
      setMpConnection(null)
    } catch {
      // silently ignore — connection state likely still changed
    } finally {
      setIsDisconnecting(false)
    }
  }

  const skeleton = <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Mi Comercio" />
      <main className="flex-1 p-6 space-y-6">

        {/* Datos del comercio */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Datos del comercio</h2>
              <p className="text-sm text-muted mt-0.5">Nombre, descripción y categoría</p>
            </div>
            {isManager && !isEditing && !isLoading && (
              <button
                onClick={startEdit}
                className="text-sm font-medium text-primary hover:underline"
              >
                Editar
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {skeleton}
              {skeleton}
            </div>
          ) : isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Categoría</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={50}
                  placeholder="ej. Gastronomía, Retail, Servicios…"
                />
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={saveEdit}
                  disabled={isSaving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSaving ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Nombre</p>
                <p className="mt-1 text-base font-semibold text-foreground">{business?.name ?? '—'}</p>
              </div>
              {business?.description && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Descripción</p>
                  <p className="mt-1 text-sm text-foreground">{business.description}</p>
                </div>
              )}
              {business?.category && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Categoría</p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {business.category}
                  </span>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Creado</p>
                <p className="mt-1 text-sm text-foreground">{formatDate(business?.createdAt)}</p>
              </div>
            </div>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Conexión Mercado Pago */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${mpConnection?.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <h2 className="text-base font-semibold text-foreground">Mercado Pago</h2>
              </div>
              {isOwner && mpConnection && !isConnecting && (
                <button
                  onClick={() => { setIsConnecting(true); setTokenError(null); setAccessToken('') }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Reconectar
                </button>
              )}
            </div>

            {isLoading || mpConnection === undefined ? (
              <div className="space-y-3">{skeleton}{skeleton}</div>
            ) : mpConnection ? (
              <div className="space-y-3">
                {isConnecting ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">Ingresá el nuevo access token de Mercado Pago para reconectar.</p>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="APP_USR-…"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {tokenError && <p className="text-sm text-red-600">{tokenError}</p>}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={connectMp}
                        disabled={isSubmittingToken || !accessToken.trim()}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                      >
                        {isSubmittingToken ? 'Verificando…' : 'Reconectar'}
                      </button>
                      <button
                        onClick={() => setIsConnecting(false)}
                        disabled={isSubmittingToken}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">Usuario MP</p>
                      <p className="mt-1 font-mono text-sm text-foreground">{mpConnection.mpUserId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">Conectado</p>
                      <p className="mt-1 text-sm text-foreground">{formatDate(mpConnection.connectedAt)}</p>
                    </div>
                    {mpConnection.lastVerifiedAt && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">Última verificación</p>
                        <p className="mt-1 text-sm text-foreground">{formatDate(mpConnection.lastVerifiedAt)}</p>
                      </div>
                    )}
                    {isOwner && (
                      <button
                        onClick={disconnectMp}
                        disabled={isDisconnecting}
                        className="mt-2 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {isDisconnecting ? 'Desconectando…' : 'Desconectar cuenta'}
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  Sin cuenta de Mercado Pago conectada. Ingresá tu access token para empezar a recibir alertas de cobros.
                </p>
                {isOwner ? (
                  isConnecting ? (
                    <div className="space-y-3">
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="APP_USR-…"
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {tokenError && <p className="text-sm text-red-600">{tokenError}</p>}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={connectMp}
                          disabled={isSubmittingToken || !accessToken.trim()}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                        >
                          {isSubmittingToken ? 'Verificando…' : 'Conectar'}
                        </button>
                        <button
                          onClick={() => { setIsConnecting(false); setTokenError(null) }}
                          disabled={isSubmittingToken}
                          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setIsConnecting(true); setTokenError(null) }}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                    >
                      Conectar Mercado Pago
                    </button>
                  )
                ) : (
                  <p className="text-sm text-muted">Solo el propietario puede conectar la cuenta.</p>
                )}
              </div>
            )}
          </Card>

          {/* Suscripción */}
          <Card>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">Suscripción</h2>
              <p className="text-sm text-muted mt-0.5">Plan activo y estado de facturación</p>
            </div>

            {isLoading || subscription === undefined ? (
              <div className="space-y-3">{skeleton}{skeleton}</div>
            ) : subscription ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Plan</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{subscription.planName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Estado</p>
                  <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    subscription.status === 'ACTIVE' || subscription.status === 'TRIALING'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
                  </span>
                </div>
                {subscription.trialEndsAt && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Prueba hasta</p>
                    <p className="mt-1 text-sm text-foreground">{formatDate(subscription.trialEndsAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Período actual hasta</p>
                  <p className="mt-1 text-sm text-foreground">{formatDate(subscription.currentPeriodEnd)}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-muted">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">Sin plan activo</p>
                <p className="mt-1 text-sm text-muted">Contactanos para activar tu suscripción.</p>
              </div>
            )}
          </Card>
        </div>

      </main>
    </div>
  )
}
