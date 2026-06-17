'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SlideOver } from '@/components/ui/SlideOver'
import { api, ApiError } from '@/lib/api'
import { updateUser } from '@/lib/auth'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'

interface Device {
  id: string
  platform: 'android' | 'ios' | 'web'
  deviceName: string | null
  lastSeenAt: string | null
  createdAt: string
}

const PLATFORM_LABELS: Record<Device['platform'], string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
}

function PlatformIcon({ platform }: { platform: Device['platform'] }) {
  if (platform === 'android') {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.523 15.341a.9.9 0 01-.9.9.9.9 0 01-.9-.9.9.9 0 01.9-.9.9.9 0 01.9.9zm-9.246 0a.9.9 0 01-.9.9.9.9 0 01-.9-.9.9.9 0 01.9-.9.9.9 0 01.9.9zM17.76 9.5l1.522-2.637a.316.316 0 00-.116-.432.317.317 0 00-.432.117L17.21 9.008A9.306 9.306 0 0012 7.745a9.306 9.306 0 00-5.21 1.263L5.267 6.548a.317.317 0 00-.432-.117.316.316 0 00-.116.432L6.24 9.5C3.833 10.865 2.2 13.35 2 16.25h20c-.2-2.9-1.833-5.385-4.24-6.75z" />
      </svg>
    )
  }
  if (platform === 'ios') {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  )
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const ms = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return 'Hace un momento'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Hace ${days}d`
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr))
}

// ─── Sección Perfil ───────────────────────────────────────────────────────────

function ProfileSection() {
  const queryClient = useQueryClient()

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () =>
      api.get<{ data: { id: string; name: string; email: string } }>('/api/v1/users/me').then((r) => r.data),
  })

  const [name, setName] = useState<string>('')
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sincronizar el campo con los datos cargados la primera vez
  const [initialized, setInitialized] = useState(false)
  if (userData && !initialized) {
    setName(userData.name)
    setInitialized(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      await api.put('/api/v1/users/me', { name: name.trim() })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      updateUser({ name: name.trim() })
      setSuccess(true)
    } catch {
      setError('No se pudo guardar el nombre. Intentá de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Tu nombre visible en el equipo.</CardDescription>
      </CardHeader>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="profile-email"
            label="Email"
            value={userData?.email ?? ''}
            disabled
          />
          <Input
            id="profile-name"
            label="Nombre"
            value={name}
            onChange={(e) => { setName(e.target.value); setSuccess(false) }}
            placeholder="Tu nombre"
            maxLength={100}
            required
          />

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Nombre actualizado correctamente.
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || !name.trim() || name.trim() === userData?.name}
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
        </form>
      )}
    </Card>
  )
}

// ─── Sección Seguridad ────────────────────────────────────────────────────────

function SecuritySection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(): string | null {
    if (!current) return 'Ingresá tu contraseña actual.'
    if (next.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.'
    if (!/[A-Z]/.test(next)) return 'La nueva contraseña debe tener al menos una mayúscula.'
    if (!/[0-9]/.test(next)) return 'La nueva contraseña debe tener al menos un número.'
    if (next !== confirm) return 'Las contraseñas no coinciden.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      await api.post('/api/v1/auth/change-password', { currentPassword: current, newPassword: next })
      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_PASSWORD') {
        setError('La contraseña actual no es correcta.')
      } else {
        setError('No se pudo cambiar la contraseña. Intentá de nuevo.')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguridad</CardTitle>
        <CardDescription>Cambiá tu contraseña. Al confirmar, se cerrarán todas tus otras sesiones activas.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput
          id="current-password"
          label="Contraseña actual"
          value={current}
          onChange={(e) => { setCurrent(e.target.value); setError(null); setSuccess(false) }}
          autoComplete="current-password"
          required
        />
        <PasswordInput
          id="new-password"
          label="Nueva contraseña"
          value={next}
          onChange={(e) => { setNext(e.target.value); setError(null); setSuccess(false) }}
          autoComplete="new-password"
          required
        />
        <PasswordInput
          id="confirm-password"
          label="Confirmar nueva contraseña"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(null); setSuccess(false) }}
          autoComplete="new-password"
          required
        />

        <p className="text-xs text-muted">Mínimo 8 caracteres, una mayúscula y un número.</p>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Contraseña actualizada. Tus otras sesiones fueron cerradas.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !current || !next || !confirm}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="border-white" />
                Actualizando...
              </span>
            ) : (
              'Actualizar contraseña'
            )}
          </button>
        </div>
      </form>
    </Card>
  )
}

// ─── Sección Suscripción ──────────────────────────────────────────────────────

interface SubscriptionDetail {
  id: string
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'
  trialEndsAt: string | null
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelledAt: string | null
  plan: {
    name: string
    slug: string
    priceARS: string
    trialDays: number
  }
}

const STATUS_LABELS: Record<SubscriptionDetail['status'], string> = {
  TRIALING: 'Período de prueba',
  ACTIVE: 'Activa',
  PAST_DUE: 'Pago pendiente',
  SUSPENDED: 'Suspendida',
  CANCELLED: 'Cancelada',
}

const STATUS_COLORS: Record<SubscriptionDetail['status'], string> = {
  TRIALING: 'bg-blue-50 text-blue-700 border-blue-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAST_DUE: 'bg-red-50 text-red-700 border-red-200',
  SUSPENDED: 'bg-orange-50 text-orange-700 border-orange-200',
  CANCELLED: 'bg-gray-50 text-gray-600 border-gray-200',
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(dateStr))
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function SubscriptionSection() {
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
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[subscription.status]}`}>
              {STATUS_LABELS[subscription.status]}
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

// ─── Sección Dispositivos ─────────────────────────────────────────────────────

function DevicesSection() {
  const queryClient = useQueryClient()
  const [revokeTarget, setRevokeTarget] = useState<Device | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      api.get<{ data: Device[] }>('/api/v1/users/me/devices').then((r) => r.data),
  })

  async function handleRevoke() {
    if (!revokeTarget) return
    setIsRevoking(true)
    setRevokeError(null)
    try {
      await api.delete(`/api/v1/users/me/devices/${revokeTarget.id}`)
      void queryClient.invalidateQueries({ queryKey: ['devices'] })
      setRevokeTarget(null)
    } catch {
      setRevokeError('No se pudo desvincular el dispositivo. Intentá de nuevo.')
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispositivos vinculados</CardTitle>
        <CardDescription>Dispositivos que reciben notificaciones push de pagos.</CardDescription>
      </CardHeader>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      ) : !devices || devices.length === 0 ? (
        <p className="text-sm text-muted">No tenés dispositivos vinculados.</p>
      ) : (
        <ul className="divide-y divide-border">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-muted">
                  <PlatformIcon platform={d.platform} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {d.deviceName ?? PLATFORM_LABELS[d.platform]}
                  </p>
                  <p className="text-xs text-muted">
                    {PLATFORM_LABELS[d.platform]} &middot; Última actividad: {formatRelative(d.lastSeenAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRevokeTarget(d)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Desvincular
              </button>
            </li>
          ))}
        </ul>
      )}

      {revokeTarget && (
        <ConfirmDialog
          title="Desvincular dispositivo"
          description={
            <>
              ¿Querés desvincular{' '}
              <strong className="text-foreground">
                {revokeTarget.deviceName ?? PLATFORM_LABELS[revokeTarget.platform]}
              </strong>
              ? Este dispositivo dejará de recibir notificaciones push.
            </>
          }
          icon={
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          confirmLabel="Desvincular"
          pendingLabel="Desvinculando..."
          onConfirm={handleRevoke}
          onCancel={() => { setRevokeTarget(null); setRevokeError(null) }}
          isPending={isRevoking}
        >
          {revokeError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {revokeError}
            </p>
          )}
        </ConfirmDialog>
      )}
    </Card>
  )
}

// ─── Sección Comercios ────────────────────────────────────────────────────────

function BusinessesSection() {
  const { businesses, businessId, refreshBusinesses } = useActiveBusiness()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setIsPending(true)
    try {
      const res = await api.post<ApiResponse<{ id: string; name: string }>>('/api/v1/businesses', { name: name.trim() })
      await refreshBusinesses(res.data.id)
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'BUSINESS_LIMIT_REACHED') {
        setError(err.message)
      } else {
        setError('No se pudo crear el comercio. Intentá de nuevo.')
      }
      setIsPending(false)
    }
  }

  function handleClose() {
    if (isPending) return
    setShowModal(false)
    setName('')
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mis comercios</CardTitle>
            <CardDescription>Comercios en los que participás.</CardDescription>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        </div>
      </CardHeader>

      {businesses.length === 0 ? (
        <p className="text-sm text-muted">No tenés comercios asociados.</p>
      ) : (
        <ul className="divide-y divide-border">
          {businesses.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted capitalize">{b.role.toLowerCase()}</p>
                </div>
              </div>
              {b.id === businessId && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Activo
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-foreground">Agregar comercio</h2>
            <p className="mt-1 text-sm text-muted">El nuevo comercio tendrá un período de prueba gratuita.</p>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              <Input
                id="new-business-name"
                label="Nombre del comercio"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null) }}
                placeholder="Ej: Mi local"
                maxLength={100}
                required
                autoFocus
              />

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-gray-100 hover:text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" className="border-white" />
                      Creando...
                    </span>
                  ) : (
                    'Crear comercio'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </Card>
  )
}

// ─── Sección MP Connect ───────────────────────────────────────────────────────

interface MpConnection {
  mpUserId: string
  isActive: boolean
  connectedAt: string
  lastVerifiedAt: string | null
}

function MpConnectSection() {
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
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {connectError}
                  </p>
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
                      <a
                        href="https://www.mercadopago.com.ar/developers/panel/app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        mercadopago.com.ar/developers/panel/app
                      </a>
                      {' '}y hacé click en <strong>Crear aplicación</strong>.
                    </p>
                    <p className="text-sm text-muted">
                      Completá el nombre (puede ser cualquiera, ej. "Pay Alert") y aceptá los términos.
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

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <PageShell title="Configuración" className="space-y-6">
      <div className="max-w-2xl space-y-6">
        <BusinessesSection />
        <MpConnectSection />
        <SubscriptionSection />
        <ProfileSection />
        <SecuritySection />
        <DevicesSection />
      </div>
    </PageShell>
  )
}
