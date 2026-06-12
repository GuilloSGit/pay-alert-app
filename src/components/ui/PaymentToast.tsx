'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { WsPaymentEvent, WsPaymentMessage } from '@/lib/use-payment-websocket'

function playCashRegister() {
  try {
    const ctx = new AudioContext()
    // Dos "dings" escalonados: el clásico "cha-ching"
    const notes = [
      { freq: 1400, start: 0,    dur: 0.12 },
      { freq: 1100, start: 0.08, dur: 0.18 },
      { freq: 1600, start: 0.16, dur: 0.10 },
    ]
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    })
  } catch {}
}

export interface PaymentToast {
  id: number
  msg: WsPaymentMessage
}

const EVENT_CONFIG: Record<WsPaymentEvent, { label: string; colorClass: string; bgClass: string }> = {
  'payment.received':  { label: 'Pago recibido',    colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50' },
  'payment.approved':  { label: 'Pago acreditado',  colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50' },
  'payment.refunded':  { label: 'Reembolso',         colorClass: 'text-amber-500',   bgClass: 'bg-amber-50'   },
  'payment.cancelled': { label: 'Pago cancelado',   colorClass: 'text-red-500',     bgClass: 'bg-red-50'     },
}

function formatAmount(amount: string, currency: string): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return amount
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: PaymentToast
  onDismiss: (id: number) => void
}) {
  const router = useRouter()
  const config = EVENT_CONFIG[toast.msg.type]
  const { data } = toast.msg

  useEffect(() => {
    if (toast.msg.type === 'payment.received' || toast.msg.type === 'payment.approved') {
      playCashRegister()
    }
    const timer = setTimeout(() => onDismiss(toast.id), 5_000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.msg.type, onDismiss])

  function handleClick() {
    router.push('/dashboard/payments')
    onDismiss(toast.id)
  }

  return (
    <div
      onClick={handleClick}
      className="animate-slide-in-right w-80 cursor-pointer rounded-xl border border-border bg-card shadow-lg"
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bgClass}`}>
          <svg className={`h-4 w-4 ${config.colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${config.colorClass}`}>
            {config.label}
          </p>
          <p className="mt-0.5 text-base font-bold text-foreground">
            {formatAmount(data.amount, data.currency)}
          </p>
          {data.payerName && (
            <p className="mt-0.5 truncate text-sm text-muted">{data.payerName}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(toast.id) }}
          className="shrink-0 text-muted transition-colors hover:text-foreground"
          aria-label="Cerrar"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function PaymentToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: PaymentToast[]
  onDismiss: (id: number) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
