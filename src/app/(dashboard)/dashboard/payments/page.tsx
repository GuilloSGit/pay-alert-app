'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { Payment, ApiResponse } from '@/types'

interface PaymentsResponse {
  data: Payment[]
  meta: { total: number; hasMore: boolean; nextCursor: string | null }
}

type StatusFilter = Payment['status'] | ''

const STATUS_LABELS: Record<Payment['status'], string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

const STATUS_CLASSES: Record<Payment['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  REFUNDED: 'bg-blue-100 text-blue-800',
}

function formatAmount(amount: string, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(Number(amount))
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function PaymentsPage() {
  const { businessId } = useActiveBusiness()

  const [payments, setPayments] = useState<Payment[]>([])
  const [meta, setMeta] = useState<{ total: number; hasMore: boolean; nextCursor: string | null }>({
    total: 0,
    hasMore: false,
    nextCursor: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState<StatusFilter>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fetchPayments = useCallback(
    async (cursor?: string) => {
      if (!businessId) return

      const params = new URLSearchParams({ limit: '20' })
      if (status) params.set('status', status)
      if (from) params.set('from', new Date(from).toISOString())
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        params.set('to', toDate.toISOString())
      }
      if (cursor) params.set('cursor', cursor)

      const res = await api.get<PaymentsResponse & ApiResponse<Payment[]>>(
        `/api/v1/businesses/${businessId}/payments?${params}`,
      )
      return res as unknown as PaymentsResponse
    },
    [businessId, status, from, to],
  )

  useEffect(() => {
    if (!businessId) return
    setIsLoading(true)
    setError(null)
    fetchPayments()
      .then((res) => {
        if (!res) return
        setPayments(res.data)
        setMeta(res.meta)
      })
      .catch(() => setError('No se pudieron cargar los pagos. Intentá de nuevo.'))
      .finally(() => setIsLoading(false))
  }, [businessId, fetchPayments])

  async function loadMore() {
    if (!meta.nextCursor) return
    setIsLoadingMore(true)
    try {
      const res = await fetchPayments(meta.nextCursor)
      if (!res) return
      setPayments((prev) => [...prev, ...res.data])
      setMeta(res.meta)
    } finally {
      setIsLoadingMore(false)
    }
  }

  function clearFilters() {
    setStatus('')
    setFrom('')
    setTo('')
  }

  const hasFilters = status !== '' || from !== '' || to !== ''

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Pagos" />
      <main className="flex-1 p-6">

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos</option>
              {(Object.keys(STATUS_LABELS) as Payment['status'][]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:bg-gray-100 hover:text-foreground"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla */}
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-muted">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">
                {hasFilters ? 'Sin resultados para los filtros aplicados' : 'Sin pagos aún'}
              </p>
              <p className="mt-1 text-sm text-muted">
                {hasFilters
                  ? 'Probá cambiando el rango de fechas o el estado.'
                  : 'Los pagos recibidos via Mercado Pago aparecen acá en tiempo real.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Pagador</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Método</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">ID MP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[p.status]}`}>
                            {STATUS_LABELS[p.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-foreground tabular-nums">
                          {formatAmount(p.amount, p.currency)}
                        </td>
                        <td className="px-6 py-4">
                          {p.payerName || p.payerEmail ? (
                            <div>
                              {p.payerName && <p className="font-medium text-foreground">{p.payerName}</p>}
                              {p.payerEmail && <p className="text-xs text-muted">{p.payerEmail}</p>}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted">{p.paymentMethod ?? '—'}</td>
                        <td className="px-6 py-4 text-muted whitespace-nowrap">
                          {formatDate(p.paidAt ?? p.receivedAt)}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted">{p.mpPaymentId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <p className="text-sm text-muted">
                  Mostrando <span className="font-medium text-foreground">{payments.length}</span> de{' '}
                  <span className="font-medium text-foreground">{meta.total}</span> pagos
                </p>
                {meta.hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-100 disabled:opacity-50"
                  >
                    {isLoadingMore && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    )}
                    Cargar más
                  </button>
                )}
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  )
}
