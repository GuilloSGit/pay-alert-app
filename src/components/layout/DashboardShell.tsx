'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { api } from '@/lib/api'
import { registerDevice } from '@/lib/device'
import { BusinessContext } from '@/lib/business-context'
import { usePaymentWebSocket } from '@/lib/use-payment-websocket'
import { PaymentToastContainer } from '@/components/ui/PaymentToast'
import type { BusinessRole, BusinessMembership, ApiResponse } from '@/types'
import type { DeviceLimitInfo } from '@/lib/device'
import type { WsPaymentMessage } from '@/lib/use-payment-websocket'
import type { PaymentToast } from '@/components/ui/PaymentToast'

function DeviceLimitModal({
  currentDevice,
  onConfirm,
  onCancel,
  isPending,
}: {
  currentDevice: DeviceLimitInfo | null
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  const deviceLabel = currentDevice?.deviceName
    ?? (currentDevice?.platform === 'web' ? 'Navegador web' : currentDevice?.platform ?? 'otro dispositivo')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Dispositivo ya vinculado</h3>
        <p className="mt-1 text-sm text-muted">
          Tu cuenta ya tiene un dispositivo activo
          {currentDevice && <> (<strong className="text-foreground">{deviceLabel}</strong>)</>}.
          Si continuás desde acá, ese dispositivo perderá acceso.
        </p>
        {currentDevice?.lastSeenAt && (
          <p className="mt-2 text-xs text-muted">
            Último acceso:{' '}
            {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(currentDevice.lastSeenAt))}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Vinculando...' : 'Usar este dispositivo'}
          </button>
        </div>
      </div>
    </div>
  )
}

let toastCounter = 0

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [role, setRole] = useState<BusinessRole | null>(null)

  const [deviceLimitModal, setDeviceLimitModal] = useState<{ currentDevice: DeviceLimitInfo | null } | null>(null)
  const [isReplacingDevice, setIsReplacingDevice] = useState(false)

  const [toasts, setToasts] = useState<PaymentToast[]>([])
  const queryClient = useQueryClient()

  const handleWsMessage = useCallback((msg: WsPaymentMessage) => {
    setToasts((prev) => {
      const next = [...prev, { id: ++toastCounter, msg }]
      return next.length > 3 ? next.slice(next.length - 3) : next
    })
    queryClient.invalidateQueries({ queryKey: ['summary'] })
    queryClient.invalidateQueries({ queryKey: ['payments'] })
  }, [queryClient])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  usePaymentWebSocket(businessId !== null, handleWsMessage)

  useEffect(() => {
    api
      .get<ApiResponse<BusinessMembership[]>>('/api/v1/businesses')
      .then((res) => {
        const first = res.data[0]
        if (first) {
          setBusinessId(first.id)
          setBusinessName(first.name)
          setRole(first.role)
        } else if (pathname !== '/dashboard/businesses') {
          router.replace('/dashboard/businesses')
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    registerDevice().then((result) => {
      if ('type' in result && result.type === 'DEVICE_LIMIT_REACHED') {
        setDeviceLimitModal({ currentDevice: result.currentDevice })
      }
    })
  }, [])

  async function handleConfirmReplace() {
    setIsReplacingDevice(true)
    await registerDevice({ force: true })
    setIsReplacingDevice(false)
    setDeviceLimitModal(null)
  }

  return (
    <BusinessContext.Provider value={{ businessId, businessName, role }}>
      <div className="flex h-full">
        <Sidebar role={role} />
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
      {deviceLimitModal && (
        <DeviceLimitModal
          currentDevice={deviceLimitModal.currentDevice}
          onConfirm={handleConfirmReplace}
          onCancel={() => setDeviceLimitModal(null)}
          isPending={isReplacingDevice}
        />
      )}
      <PaymentToastContainer toasts={toasts} onDismiss={dismissToast} />
    </BusinessContext.Provider>
  )
}
