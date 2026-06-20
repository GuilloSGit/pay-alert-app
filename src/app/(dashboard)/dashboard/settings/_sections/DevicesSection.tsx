'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { api } from '@/lib/api'
import { registerPushIfPermitted } from '@/lib/push'
import { type Device, PLATFORM_LABELS, formatRelative, formatDate } from './types'

// BeforeInstallPromptEvent no está en los tipos estándar de TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function InstallPwaBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIosNotInstalled, setIsIosNotInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // ¿Está corriendo como PWA instalada?
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as Record<string, unknown>).standalone === true)
    if (isStandalone) return

    // iOS Safari: no hay evento de install, mostramos instrucciones manuales
    const ua = navigator.userAgent
    const isIos = /iPhone|iPad|iPod/.test(ua)
    const isSafariIos = isIos && /Safari/i.test(ua) && !/CriOS|FxiOS/.test(ua)
    if (isSafariIos) {
      setIsIosNotInstalled(true)
      return
    }

    // Android / desktop Chrome: escuchar BeforeInstallPromptEvent
    const handler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as BeforeInstallPromptEvent
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    setInstalling(true)
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
    setInstalling(false)
  }

  if (dismissed || (!installPrompt && !isIosNotInstalled)) return null

  if (isIosNotInstalled) {
    return (
      <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-medium text-emerald-800">Instalá Pay Alert en tu iPhone</p>
        <p className="mt-1 text-xs text-emerald-700">
          Tocá <strong>Compartir</strong> (
          <svg className="inline h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
          </svg>
          ) y luego <strong>"Agregar a inicio"</strong> para recibir notificaciones cuando el browser esté cerrado.
        </p>
        <button onClick={() => setDismissed(true)} className="mt-2 text-xs text-emerald-600 underline">
          Entendido
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-sm text-emerald-800">
        Instalá Pay Alert para recibir notificaciones aunque el browser esté cerrado.
      </p>
      <div className="ml-4 flex gap-2">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex-shrink-0 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {installing ? 'Instalando...' : 'Instalar app'}
        </button>
        <button onClick={() => setDismissed(true)} className="text-xs text-emerald-600 underline">
          Ahora no
        </button>
      </div>
    </div>
  )
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

export function DevicesSection() {
  const queryClient = useQueryClient()
  const [revokeTarget, setRevokeTarget] = useState<Device | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return null
  })
  const [isActivatingPush, setIsActivatingPush] = useState(false)
  const [testPushStatus, setTestPushStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleActivatePush() {
    setIsActivatingPush(true)
    await registerPushIfPermitted()
    if ('Notification' in window) setPushPermission(Notification.permission)
    void queryClient.invalidateQueries({ queryKey: ['devices'] })
    setIsActivatingPush(false)
  }

  async function handleTestPush() {
    setTestPushStatus('sending')
    try {
      await api.post('/api/v1/users/me/test-push', {})
      setTestPushStatus('sent')
      setTimeout(() => setTestPushStatus('idle'), 4000)
    } catch {
      setTestPushStatus('error')
      setTimeout(() => setTestPushStatus('idle'), 3000)
    }
  }

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

      <InstallPwaBanner />

      {pushPermission !== null && pushPermission !== 'granted' && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-700">
            {pushPermission === 'denied'
              ? 'Las notificaciones push están bloqueadas en este navegador.'
              : 'Activá las notificaciones push para recibir alertas de pago en este dispositivo.'}
          </p>
          {pushPermission !== 'denied' && (
            <button
              onClick={handleActivatePush}
              disabled={isActivatingPush}
              className="ml-4 flex-shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isActivatingPush ? 'Activando...' : 'Activar'}
            </button>
          )}
        </div>
      )}

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
                  <p className="text-xs text-muted">
                    Registrado: {formatDate(d.createdAt)}
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

      {devices && devices.length > 0 && pushPermission === 'granted' && (
        <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
          <button
            onClick={handleTestPush}
            disabled={testPushStatus === 'sending'}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {testPushStatus === 'sending' ? 'Enviando...' : testPushStatus === 'sent' ? '¡Enviada!' : testPushStatus === 'error' ? 'Error al enviar' : 'Probar notificación'}
          </button>
          {testPushStatus === 'sent' && (
            <p className="text-xs text-muted">Minimizá el browser para verla como notificación nativa del sistema.</p>
          )}
          {testPushStatus === 'idle' && (
            <p className="text-xs text-muted">Minimizá el browser antes de probar para verla como notificación nativa.</p>
          )}
        </div>
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
