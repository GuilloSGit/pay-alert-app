'use client'

import { useEffect, useRef } from 'react'
import { getAccessToken } from './auth'
import { tryRefresh } from './api'

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

export function usePaymentWebSocket(
  enabled: boolean,
  onMessage: (msg: WsPaymentMessage) => void,
) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!enabled) return

    let ws: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let delay = 1_000
    let active = true

    function connect() {
      if (!active) return
      const token = getAccessToken()
      if (!token) return

      ws = new WebSocket(`${WS_BASE}/api/v1/ws?token=${encodeURIComponent(token)}`)

      ws.onopen = () => {
        delay = 1_000
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsPaymentMessage
          onMessageRef.current(msg)
        } catch {}
      }

      ws.onclose = (event) => {
        if (!active) return
        // 4001 = token inválido/expirado — refrescar antes de reconectar
        if (event.code === 4001) {
          tryRefresh().then(connect)
          return
        }
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
