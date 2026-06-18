'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { api } from '@/lib/api'
import { type Device, PLATFORM_LABELS, formatRelative } from './types'

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

export function DevicesSection() {
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
