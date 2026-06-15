'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { api } from '@/lib/api'
import { registerDevice } from '@/lib/device'
import { BusinessContext } from '@/lib/business-context'
import type { BusinessBrief } from '@/lib/business-context'
import { usePaymentWebSocket } from '@/lib/use-payment-websocket'
import { PaymentToastContainer } from '@/components/ui/PaymentToast'
import type { BusinessRole, BusinessMembership, ApiResponse } from '@/types'
import type { DeviceLimitInfo } from '@/lib/device'
import type { WsPaymentMessage } from '@/lib/use-payment-websocket'
import type { PaymentToast } from '@/components/ui/PaymentToast'


let toastCounter = 0

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [role, setRole] = useState<BusinessRole | null>(null)
  const [businesses, setBusinesses] = useState<BusinessBrief[]>([])

  const [deviceLimitModal, setDeviceLimitModal] = useState<{ currentDevice: DeviceLimitInfo | null } | null>(null)
  const [isReplacingDevice, setIsReplacingDevice] = useState(false)

  const [toasts, setToasts] = useState<PaymentToast[]>([])
  const queryClient = useQueryClient()
  const pathnameAtMount = useRef(pathname)

  const handleWsMessage = useCallback((msg: WsPaymentMessage) => {
    setToasts((prev) => {
      const next = [...prev, { id: ++toastCounter, msg }]
      return next.length > 3 ? next.slice(next.length - 3) : next
    })
    void queryClient.refetchQueries({ queryKey: ['summary'], type: 'active' })
    void queryClient.refetchQueries({ queryKey: ['payments'], type: 'active' })
  }, [queryClient])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  usePaymentWebSocket(businessId !== null, handleWsMessage)

  useEffect(() => {
    api
      .get<ApiResponse<BusinessMembership[]>>('/api/v1/businesses')
      .then((res) => {
        const list = res.data
        setBusinesses(list.map((b) => ({ id: b.id, name: b.name, role: b.role })))
        const first = list[0]
        if (first) {
          setBusinessId(first.id)
          setBusinessName(first.name)
          setRole(first.role)
        } else if (pathnameAtMount.current !== '/dashboard/businesses') {
          router.replace('/dashboard/businesses')
        }
      })
      .catch(() => {})
  }, [router])

  function switchBusiness(id: string) {
    const b = businesses.find((b) => b.id === id)
    if (!b || b.id === businessId) return
    setBusinessId(b.id)
    setBusinessName(b.name)
    setRole(b.role)
    queryClient.clear()
    router.push('/dashboard')
  }

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
    <BusinessContext.Provider value={{ businessId, businessName, role, businesses, switchBusiness }}>
      <div className="flex h-full">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
      {deviceLimitModal && (() => {
        const currentDevice = deviceLimitModal.currentDevice
        const deviceLabel = currentDevice?.deviceName
          ?? (currentDevice?.platform === 'web' ? 'Navegador web' : currentDevice?.platform ?? 'otro dispositivo')
        return (
          <ConfirmDialog
            title="Dispositivo ya vinculado"
            description={
              <>
                Tu cuenta ya tiene un dispositivo activo
                {currentDevice && <> (<strong className="text-foreground">{deviceLabel}</strong>)</>}.
                Si continuás desde acá, ese dispositivo perderá acceso.
              </>
            }
            icon={
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            iconBgClass="bg-amber-100"
            confirmLabel="Usar este dispositivo"
            pendingLabel="Vinculando..."
            confirmClassName="bg-primary text-white"
            onConfirm={handleConfirmReplace}
            onCancel={() => setDeviceLimitModal(null)}
            isPending={isReplacingDevice}
            closeOnBackdrop={false}
          >
            {currentDevice?.lastSeenAt && (
              <p className="mt-2 text-xs text-muted">
                Último acceso:{' '}
                {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(currentDevice.lastSeenAt))}
              </p>
            )}
          </ConfirmDialog>
        )
      })()}
      <PaymentToastContainer toasts={toasts} onDismiss={dismissToast} />
    </BusinessContext.Provider>
  )
}
