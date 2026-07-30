'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { api, ApiError } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'
import { type ApiKeySummary, formatDate, formatRelative } from './types'

function maskPrefix(prefix: string): string {
  return `${prefix}${'•'.repeat(24)}`
}

export function ApiKeysSection() {
  const { businessId, role } = useActiveBusiness()
  const queryClient = useQueryClient()
  const isOwner = role === 'OWNER'

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [name, setName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [revokeTarget, setRevokeTarget] = useState<ApiKeySummary | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<ApiKeySummary[]>>(`/api/v1/businesses/${businessId}/api-keys`)
        .then((r) => r.data),
    enabled: !!businessId && isOwner,
  })

  if (!isOwner) return null

  function openCreateModal() {
    setName('')
    setExpiresAt('')
    setCreateError(null)
    setShowCreateModal(true)
  }

  async function handleCreate() {
    if (!businessId || !name.trim()) return
    setIsCreating(true)
    setCreateError(null)
    try {
      const body: { name: string; expiresAt?: string } = { name: name.trim() }
      if (expiresAt) body.expiresAt = new Date(`${expiresAt}T23:59:59.000Z`).toISOString()

      const created = await api
        .post<ApiResponse<ApiKeySummary & { key: string }>>(
          `/api/v1/businesses/${businessId}/api-keys`,
          body,
        )
        .then((r) => r.data)

      setShowCreateModal(false)
      setRevealedKey(created.key)
      void queryClient.invalidateQueries({ queryKey: ['api-keys', businessId] })
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'No se pudo crear la API key.')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleCopy() {
    if (!revealedKey) return
    try {
      await navigator.clipboard.writeText(revealedKey)
      setCopied(true)
    } catch {
      // Fallback para navegadores sin Clipboard API o sin permiso (ej. contexto no seguro)
      const textarea = document.createElement('textarea')
      textarea.value = revealedKey
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      try {
        setCopied(document.execCommand('copy'))
      } finally {
        document.body.removeChild(textarea)
      }
    }
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRevoke() {
    if (!revokeTarget || !businessId) return
    setIsRevoking(true)
    setRevokeError(null)
    try {
      await api.delete(`/api/v1/businesses/${businessId}/api-keys/${revokeTarget.id}`)
      void queryClient.invalidateQueries({ queryKey: ['api-keys', businessId] })
      setRevokeTarget(null)
    } catch (err) {
      setRevokeError(err instanceof ApiError ? err.message : 'No se pudo revocar la API key.')
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <CardHeader className="mb-4 flex-1">
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Para integrar sistemas externos server-to-server (ej. registrar pagos esperados) sin un usuario
            logueado. Requiere plan Enterprise.
          </CardDescription>
        </CardHeader>
        {keys && keys.length > 0 && (
          <Button size="sm" onClick={openCreateModal} className="mt-1 shrink-0">
            Crear API key
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      ) : !keys || keys.length === 0 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">No tenés API keys creadas.</p>
          <Button size="sm" onClick={openCreateModal}>
            Crear API key
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-foreground">{k.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted">{maskPrefix(k.prefix)}</p>
                <p className="mt-1 text-xs text-muted">
                  Creada: {formatDate(k.createdAt)} &middot; Último uso: {formatRelative(k.lastUsedAt)}
                  {k.expiresAt && <> &middot; Vence: {formatDate(k.expiresAt)}</>}
                </p>
              </div>
              <button
                onClick={() => setRevokeTarget(k)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Crear API key */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isCreating && setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground">Crear API key</h3>
            <p className="mt-1 text-sm text-muted">
              El valor completo se muestra una sola vez, inmediatamente después de crearla.
            </p>

            <div className="mt-4 space-y-3">
              <Input
                label="Nombre"
                placeholder="Ej: Integración ERP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoFocus
              />
              <Input
                label="Vencimiento (opcional)"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            {createError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {createError}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <Button onClick={handleCreate} loading={isCreating} disabled={!name.trim()} className="flex-1">
                Crear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal de la key recién creada — una sola vez */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground">Guardá esta API key ahora</h3>
            <p className="mt-1 text-sm text-muted">
              No se va a volver a mostrar. Si la perdés, vas a tener que revocarla y crear una nueva.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
              <code className="flex-1 break-all font-mono text-sm text-foreground">{revealedKey}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-gray-50"
              >
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <Button onClick={() => setRevealedKey(null)} className="mt-6 w-full">
              Ya la copié
            </Button>
          </div>
        </div>
      )}

      {revokeTarget && (
        <ConfirmDialog
          title="Eliminar API key"
          description={
            <>
              ¿Querés eliminar <strong className="text-foreground">{revokeTarget.name}</strong>? Cualquier
              sistema que la use dejará de poder autenticarse. Esta acción no se puede deshacer.
            </>
          }
          icon={
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
          confirmLabel="Eliminar"
          pendingLabel="Eliminando..."
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
