'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { api } from './api'

// WS URL separada porque las rewrites de Next.js solo proxean HTTP, no WebSocket.
// En prod: NEXT_PUBLIC_WS_URL = wss://pay-alert-api.onrender.com
// En local: NEXT_PUBLIC_WS_URL = ws://localhost:3001 (aunque NEXT_PUBLIC_API_URL sea :3000)
const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ??
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
    .replace(/^https/, 'wss')
    .replace(/^http/, 'ws')

export type WsPaymentEvent =
  | 'payment.received'
  | 'payment.approved'
  | 'payment.refunded'
  | 'payment.cancelled'

export interface WsPaymentMessage {
  type: WsPaymentEvent
  data: {
    id: string
    amount: string
    currency: string
    description: string | null
    payerName: string | null
    status: string
    paidAt: string | null
    receivedAt: string
  }
}

export interface WsMpTokenInvalidMessage {
  type: 'mp.token_invalid'
  data: { businessId: string }
}

export type WsMessage = WsPaymentMessage | WsMpTokenInvalidMessage

export function usePaymentWebSocket(
  enabled: boolean,
  onMessage: (msg: WsMessage) => void,
) {
  const onMessageRef = useRef(onMessage)
  useLayoutEffect(() => {
    onMessageRef.current = onMessage
  })

  useEffect(() => {
    if (!enabled) return

    let ws: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let delay = 1_000
    let active = true

    async function connect() {
      if (!active) return

      // Obtener token efímero de un solo uso (30s TTL).
      // api.post maneja automáticamente el refresh del access token si expiró.
      let wsToken: string
      try {
        const res = await api.post<{ data: { token: string } }>('/api/v1/auth/ws-token', {})
        wsToken = res.data.token
      } catch {
        // Si el refresh también falló, api.post ya redirigió a /login.
        // Cualquier otro error: reintentar con backoff.
        if (!active) return
        const current = delay
        delay = Math.min(delay * 2, 30_000)
        reconnectTimeout = setTimeout(connect, current)
        return
      }

      if (!active) return

      ws = new WebSocket(`${WS_BASE}/api/v1/ws?token=${encodeURIComponent(wsToken)}`)

      ws.onopen = () => {
        delay = 1_000
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage
          if (!msg.type?.startsWith('payment.') && msg.type !== 'mp.token_invalid') return
          onMessageRef.current(msg)
        } catch {}
      }

      ws.onclose = () => {
        if (!active) return
        const current = delay
        delay = Math.min(delay * 2, 30_000)
        reconnectTimeout = setTimeout(connect, current)
      }

      ws.onerror = () => {
        ws?.close()
      }
    }

    connect()

    return () => {
      active = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      ws?.close()
    }
  }, [enabled])
}
