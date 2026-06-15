'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '@/components/layout/PageShell'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { SlideOver } from '@/components/ui/SlideOver'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { api, ApiError } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { BusinessMember, BusinessRole } from '@/types'

interface PendingInvitation {
  id: string
  email: string
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER'
  expiresAt: string
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Dueño',
  ADMIN: 'Administrador',
  MEMBER: 'Empleado',
  OBSERVER: 'Observador',
}

const ROLE_CLASSES: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  MEMBER: 'bg-emerald-100 text-emerald-800',
  OBSERVER: 'bg-gray-100 text-gray-600',
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: 'Puede gestionar pagos, miembros e invitaciones',
  MEMBER: 'Puede ver pagos y recibir notificaciones',
  OBSERVER: 'Solo puede ver el dashboard, sin notificaciones',
}

const AVATAR_COLORS = [
  'bg-primary',
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
]

function avatarColor(userId: string) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(dateStr),
  )
}

function timeRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expirada'
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours < 1) return 'Menos de 1h'
  if (hours < 24) return `${hours}h restantes`
  return `${Math.floor(hours / 24)}d restantes`
}

// ─── Invite Slide-Over ────────────────────────────────────────────────────────

interface InviteSlideOverProps {
  businessId: string
  onSuccess: () => void
  onClose: () => void
}

function InviteSlideOver({ businessId, onSuccess, onClose }: InviteSlideOverProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'OBSERVER'>('MEMBER')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      await api.post(`/api/v1/businesses/${businessId}/invitations`, { email: email.trim(), role })
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ALREADY_MEMBER') setError('Esta persona ya es miembro del equipo.')
        else if (err.code === 'PLAN_LIMIT_REACHED')
          setError('Límite de miembros alcanzado para tu plan actual.')
        else setError('No se pudo enviar la invitación. Intentá de nuevo.')
      } else {
        setError('No se pudo enviar la invitación. Intentá de nuevo.')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <SlideOver title="Invitar miembro" subtitle="El invitado recibirá un email con un enlace" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@empresa.com"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">Rol</label>
          {(['ADMIN', 'MEMBER', 'OBSERVER'] as const).map((r) => (
            <label
              key={r}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                role === r ? 'border-primary bg-primary-light' : 'border-border hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="mt-0.5 accent-primary"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">{ROLE_LABELS[r]}</p>
                <p className="mt-0.5 text-xs text-muted">{ROLE_DESCRIPTIONS[r]}</p>
              </div>
            </label>
          ))}
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-auto">
          <button
            type="submit"
            disabled={isPending || !email.trim()}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" className="border-white" />
                Enviando...
              </span>
            ) : (
              'Enviar invitación'
            )}
          </button>
        </div>
      </form>
    </SlideOver>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function MembersPage() {
  const { businessId, role: currentRole } = useActiveBusiness()
  const queryClient = useQueryClient()

  const [showInvite, setShowInvite] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<BusinessMember | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [cancellingInvId, setCancellingInvId] = useState<string | null>(null)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const isOwner = currentRole === 'OWNER'
  const isManager = currentRole === 'OWNER' || currentRole === 'ADMIN'

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['members', businessId],
    queryFn: () =>
      api
        .get<{ data: { members: BusinessMember[]; invitations: PendingInvitation[] } }>(
          `/api/v1/businesses/${businessId}/members`,
        )
        .then((r) => r.data),
    enabled: !!businessId,
  })

  const members = data?.members ?? []
  const invitations = data?.invitations ?? []
  const error = queryError ? 'No se pudieron cargar los miembros. Intentá de nuevo.' : null

  async function handleRoleChange(memberId: string, newRole: BusinessRole) {
    if (!businessId) return
    setChangingRoleId(memberId)
    setActionError(null)
    try {
      await api.put(`/api/v1/businesses/${businessId}/members/${memberId}/role`, { role: newRole })
      void queryClient.invalidateQueries({ queryKey: ['members', businessId] })
    } catch {
      setActionError('No se pudo cambiar el rol. Intentá de nuevo.')
    } finally {
      setChangingRoleId(null)
    }
  }

  async function handleRevoke() {
    if (!businessId || !revokeTarget) return
    setIsRevoking(true)
    setRevokeError(null)
    try {
      await api.delete(`/api/v1/businesses/${businessId}/members/${revokeTarget.id}`)
      setRevokeTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['members', businessId] })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setRevokeError('Este miembro ya no está activo. Recargá la página para ver el estado actualizado.')
          void queryClient.invalidateQueries({ queryKey: ['members', businessId] })
        } else if (err.status === 403) {
          setRevokeError('Sin permisos para revocar miembros en este comercio.')
        } else if (err.status === 402) {
          setRevokeError('Suscripción inactiva. No es posible realizar esta acción.')
        } else {
          setRevokeError(`No se pudo revocar el acceso. (${err.status})`)
        }
      } else {
        setRevokeError('No se pudo revocar el acceso. Intentá de nuevo.')
      }
    } finally {
      setIsRevoking(false)
    }
  }

  async function handleCancelInvitation(invId: string) {
    if (!businessId) return
    setCancellingInvId(invId)
    setActionError(null)
    try {
      await api.delete(`/api/v1/businesses/${businessId}/invitations/${invId}`)
      void queryClient.invalidateQueries({ queryKey: ['members', businessId] })
    } catch {
      setActionError('No se pudo cancelar la invitación. Intentá de nuevo.')
    } finally {
      setCancellingInvId(null)
    }
  }

  function handleInviteSuccess() {
    setShowInvite(false)
    void queryClient.invalidateQueries({ queryKey: ['members', businessId] })
  }

  return (
    <PageShell title="Equipo" className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <>
          {actionError && (
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{actionError}</span>
              <button onClick={() => setActionError(null)} className="ml-4 font-medium underline hover:no-underline">
                Cerrar
              </button>
            </div>
          )}

          {/* Resumen + botón invitar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              <span className="font-medium text-foreground">{members.length}</span>{' '}
              {members.length === 1 ? 'miembro activo' : 'miembros activos'}
              {invitations.length > 0 && (
                <>
                  {' '}
                  &middot;{' '}
                  <span className="font-medium text-foreground">{invitations.length}</span>{' '}
                  {invitations.length === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}
                </>
              )}
            </p>
            {isManager && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Invitar miembro
              </button>
            )}
          </div>

          {/* Tabla de miembros activos */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Miembros activos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Miembro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Desde</th>
                    {isManager && (
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => (
                    <tr key={m.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(m.user.id)}`}>
                            {getInitials(m.user.name)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{m.user.name}</p>
                            <p className="text-xs text-muted">{m.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isOwner && m.role !== 'OWNER' ? (
                          <select
                            value={m.role}
                            disabled={changingRoleId === m.id}
                            onChange={(e) => handleRoleChange(m.id, e.target.value as BusinessRole)}
                            className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                          >
                            {(['ADMIN', 'MEMBER', 'OBSERVER'] as const).map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge className={ROLE_CLASSES[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted">{formatDate(m.joinedAt)}</td>
                      {isManager && (
                        <td className="px-6 py-4 text-right">
                          {m.role !== 'OWNER' && (
                            <button
                              onClick={() => setRevokeTarget(m)}
                              className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              Revocar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tabla de invitaciones pendientes */}
          {invitations.length > 0 && (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-sm font-semibold text-foreground">Invitaciones pendientes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Tiempo restante</th>
                      {isManager && (
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-foreground">{inv.email}</td>
                        <td className="px-6 py-4">
                          <Badge className={ROLE_CLASSES[inv.role]}>{ROLE_LABELS[inv.role]}</Badge>
                        </td>
                        <td className="px-6 py-4 text-muted">{timeRemaining(inv.expiresAt)}</td>
                        {isManager && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleCancelInvitation(inv.id)}
                              disabled={cancellingInvId === inv.id}
                              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-gray-100 hover:text-foreground disabled:opacity-50"
                            >
                              {cancellingInvId === inv.id ? 'Cancelando...' : 'Cancelar'}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {showInvite && businessId && (
        <InviteSlideOver
          businessId={businessId}
          onSuccess={handleInviteSuccess}
          onClose={() => setShowInvite(false)}
        />
      )}

      {revokeTarget && (
        <ConfirmDialog
          title="Revocar acceso"
          description={
            <>
              ¿Querés revocar el acceso de{' '}
              <strong className="text-foreground">{revokeTarget.user.name}</strong>? Ya no podrá
              ingresar al comercio.
            </>
          }
          icon={
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
            </svg>
          }
          confirmLabel="Revocar acceso"
          pendingLabel="Revocando..."
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
    </PageShell>
  )
}
