'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageShell } from '@/components/layout/PageShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { api, ApiError } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { Business, ApiResponse } from '@/types'

const MP_ERROR_MESSAGES: Record<string, string> = {
  cancelled: 'Cancelaste la autorización en Mercado Pago.',
  already_connected: 'Esta cuenta de Mercado Pago ya está conectada a otro comercio.',
  token_exchange_failed: 'Hubo un error al obtener los tokens de Mercado Pago. Intentá de nuevo.',
  invalid_state: 'El enlace de autorización expiró. Intentá de nuevo.',
  not_configured: 'OAuth de MP no configurado. Contactá a soporte.',
}

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

const BUSINESS_CATEGORIES = [
  { slug: 'retail',       label: 'Retail / Indumentaria' },
  { slug: 'gastronomy',   label: 'Gastronomía' },
  { slug: 'hospitality',  label: 'Hotelería / Alojamiento' },
  { slug: 'services',     label: 'Servicios profesionales' },
  { slug: 'health',       label: 'Salud / Bienestar' },
  { slug: 'beauty',       label: 'Peluquería / Estética' },
  { slug: 'kiosk',        label: 'Kiosco / Almacén' },
  { slug: 'ecommerce',    label: 'E-commerce / Venta online' },
  { slug: 'education',    label: 'Educación / Capacitación' },
  { slug: 'transport',    label: 'Transporte / Logística' },
  { slug: 'other',        label: 'Otro' },
] as const

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

function MpCallbackHandler({
  setOauthSuccess,
  setOauthError,
}: {
  setOauthSuccess: (v: boolean) => void
  setOauthError: (v: string | null) => void
}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const mp = searchParams.get('mp')
    const mpError = searchParams.get('mp_error')
    if (mp) {
      if (mp === 'connected') setOauthSuccess(true)
      else if (mp === 'error') setOauthError(MP_ERROR_MESSAGES[mpError ?? ''] ?? 'Error al conectar con Mercado Pago.')
      const url = new URL(window.location.href)
      url.searchParams.delete('mp')
      url.searchParams.delete('mp_error')
      url.searchParams.delete('businessId')
      router.replace(url.pathname + (url.search || ''), { scroll: false })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function BusinessesPage() {
  const { businessId, businessName, role } = useActiveBusiness()
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
  const [isPending, setIsPending] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [oauthSuccess, setOauthSuccess] = useState(false)
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

  async function handleOAuth() {
    if (!businessId) return
    setIsPending(true)
    setOauthError(null)
    try {
      const res = await api.get<ApiResponse<{ url: string }>>(
        `/api/v1/businesses/${businessId}/mp-connect/oauth?returnTo=/dashboard/businesses`,
      )
      window.location.href = res.data.url
    } catch {
      setOauthError('No se pudo iniciar la conexión. Intentá de nuevo.')
      setIsPending(false)
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
    <PageShell title={businessName ?? 'Mi Comercio'} className="space-y-6">
        <Suspense fallback={null}>
          <MpCallbackHandler setOauthSuccess={setOauthSuccess} setOauthError={setOauthError} />
        </Suspense>

        {/* Banner onboarding — visible si el usuario no tiene comercio aún */}
        {!businessId && (
          <div className="flex items-start gap-4 rounded-xl border border-primary/30 bg-primary-light px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-dark">¡Bienvenido a Pay Alert!</p>
              <p className="mt-0.5 text-sm text-primary-dark/80">
                Creá tu primer comercio y conectalo a Mercado Pago para empezar a recibir alertas de cobros en tiempo real.
              </p>
            </div>
          </div>
        )}

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
                <label className="block text-sm font-medium text-foreground mb-1">Rubro</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sin especificar</option>
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
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
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Rubro</p>
                  <Badge className="mt-1 bg-gray-100 text-gray-700">
                    {BUSINESS_CATEGORIES.find((c) => c.slug === business.category)?.label ?? business.category}
                  </Badge>
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
              {isOwner && mpConnection && (
                <button
                  onClick={handleOAuth}
                  disabled={isPending}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Reconectar
                </button>
              )}
            </div>

            {isLoading || mpConnection === undefined ? (
              <div className="space-y-3">{skeleton}{skeleton}</div>
            ) : mpConnection ? (
              <div className="space-y-3">
                {oauthSuccess && (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Cuenta reconectada correctamente.
                  </p>
                )}
                {oauthError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{oauthError}</p>
                )}
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
              </div>
            ) : (
              <div className="space-y-3">
                {oauthError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{oauthError}</p>
                )}
                <p className="text-sm text-muted">
                  Sin cuenta de Mercado Pago conectada. Autorizá el acceso para empezar a recibir alertas de cobros.
                </p>
                {isOwner ? (
                  <div className="space-y-3">
                        <button
                          onClick={handleOAuth}
                          disabled={isPending}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#009EE3] bg-[#009EE3] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {isPending ? (
                            <><Spinner size="sm" className="border-white" />Redirigiendo...</>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                                <circle cx="16" cy="16" r="16" fill="white" />
                                <path d="M8.5 20.5c.7 1.2 2 2 3.5 2h7c1.5 0 2.8-.8 3.5-2l2-3.5c.3-.5.5-1.1.5-1.7V13c0-2.2-1.8-4-4-4h-4l-1.5 2.5H17c.8 0 1.5.7 1.5 1.5S17.8 14.5 17 14.5h-1l-1.5 2.5h2.5c.8 0 1.5.7 1.5 1.5S17.8 20 17 20h-5c-.5 0-1-.2-1.3-.5L8.5 20.5z" fill="#009EE3" />
                              </svg>
                              Conectar con Mercado Pago
                            </>
                          )}
                        </button>
                  </div>
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
                  <Badge className={`mt-1 ${
                    subscription.status === 'ACTIVE' || subscription.status === 'TRIALING'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
                  </Badge>
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
              <EmptyState
                size="sm"
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                }
                title="Sin plan activo"
                description="Contactanos para activar tu suscripción."
              />
            )}
          </Card>
        </div>

    </PageShell>
  )
}
