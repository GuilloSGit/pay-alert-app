'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { Payment, ApiResponse } from '@/types'

interface PaymentsResponse {
  data: Payment[]
  meta: { total: number; hasMore: boolean; nextCursor: string | null }
}

interface AfipData {
  cuit: string | null
  cuitType: string | null
  afipName: string | null
  available: boolean
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  money_transfer: 'Transferencia',
  regular_payment: 'QR / Cobro',
  account_money: 'Cuenta MP',
  debit_card: 'Tarjeta débito',
  credit_card: 'Tarjeta crédito',
  bank_transfer: 'Transferencia bancaria',
  ticket: 'Cupón / Efectivo',
  atm: 'ATM',
  digital_currency: 'Billetera virtual',
  prepaid_card: 'Tarjeta prepago',
}

function formatPaymentMethod(method: string | null | undefined) {
  if (!method) return '—'
  return PAYMENT_METHOD_LABELS[method] ?? method
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

function formatDateFull(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

// ─── Panel de detalle ────────────────────────────────────────────────────────

interface DetailPanelProps {
  payment: Payment
  businessId: string
  onClose: () => void
}

function DetailPanel({ payment, businessId, onClose }: DetailPanelProps) {
  const [afipData, setAfipData] = useState<AfipData | null>(null)
  const [isLoadingAfip, setIsLoadingAfip] = useState(true)

  useEffect(() => {
    setIsLoadingAfip(true)
    setAfipData(null)
    api
      .get<{ data: AfipData }>(`/api/v1/businesses/${businessId}/payments/${payment.id}/afip`)
      .then((res) => setAfipData(res.data))
      .catch(() => setAfipData({ cuit: null, cuitType: null, afipName: null, available: false }))
      .finally(() => setIsLoadingAfip(false))
  }, [payment.id, businessId])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Detalle del pago</h2>
            <p className="text-xs text-muted font-mono mt-0.5">{payment.mpPaymentId}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-gray-100 hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Monto + Estado */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {formatAmount(payment.amount, payment.currency)}
              </p>
              <p className="mt-1 text-sm text-muted">{formatDateFull(payment.paidAt ?? payment.receivedAt)}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_CLASSES[payment.status]}`}>
              {STATUS_LABELS[payment.status]}
            </span>
          </div>

          {/* Datos del pago */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Datos del pago</h3>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-muted">Método</dt>
                <dd className="font-medium text-foreground">{formatPaymentMethod(payment.paymentMethod)}</dd>
              </div>
              {payment.description && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted">Descripción</dt>
                  <dd className="font-medium text-foreground text-right max-w-[60%]">{payment.description}</dd>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <dt className="text-muted">Recibido</dt>
                <dd className="font-medium text-foreground">{formatDate(payment.receivedAt)}</dd>
              </div>
              {payment.paidAt && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted">Acreditado</dt>
                  <dd className="font-medium text-foreground">{formatDate(payment.paidAt)}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Pagador — datos de MP */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Pagador (Mercado Pago)</h3>
            <dl className="space-y-3">
              {payment.payerName ? (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted">Nombre</dt>
                  <dd className="font-medium text-foreground">{payment.payerName}</dd>
                </div>
              ) : null}
              {payment.payerEmail ? (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted">Email</dt>
                  <dd className="font-medium text-foreground break-all">{payment.payerEmail}</dd>
                </div>
              ) : null}
              {!payment.payerName && !payment.payerEmail && (
                <p className="text-sm text-muted italic">Pagador anónimo — MP no expone los datos para esta transacción.</p>
              )}
            </dl>
          </section>

          {/* Datos AFIP / ARCA */}
          <section className="rounded-xl border border-border bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Identidad AFIP / ARCA</h3>
              {isLoadingAfip && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </div>

            {isLoadingAfip ? (
              <div className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
            ) : afipData?.available ? (
              <dl className="space-y-3">
                <div className="flex justify-between text-sm">
                  <dt className="text-muted">{afipData.cuitType ?? 'CUIT/CUIL'}</dt>
                  <dd className="font-mono text-foreground">{afipData.cuit}</dd>
                </div>
                {afipData.afipName ? (
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted">Razón social</dt>
                    <dd className="font-semibold text-foreground text-right">{afipData.afipName}</dd>
                  </div>
                ) : (
                  <p className="text-sm text-muted italic">CUIT encontrado pero sin nombre en el padrón.</p>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted italic">
                Sin datos tributarios disponibles — MP no expone la identificación del pagador para esta transacción.
              </p>
            )}
          </section>

        </div>
      </div>
    </>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { businessId } = useActiveBusiness()

  const [extraPayments, setExtraPayments] = useState<Payment[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const [status, setStatus] = useState<StatusFilter>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildParams = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams({ limit: '20' })
      if (status) params.set('status', status)
      if (from) params.set('from', new Date(from).toISOString())
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        params.set('to', toDate.toISOString())
      }
      if (q.trim()) params.set('q', q.trim())
      if (cursor) params.set('cursor', cursor)
      return params
    },
    [status, from, to, q],
  )

  const { data: baseData, isLoading, error: queryError } = useQuery({
    queryKey: ['payments', businessId, status, from, to, q],
    queryFn: () =>
      api
        .get<PaymentsResponse & ApiResponse<Payment[]>>(
          `/api/v1/businesses/${businessId}/payments?${buildParams()}`,
        )
        .then((r) => r as unknown as PaymentsResponse),
    enabled: !!businessId,
  })

  const error = queryError ? 'No se pudieron cargar los pagos. Intentá de nuevo.' : null

  // Resetear páginas extra cuando cambian los filtros o llega un refresh del WS
  useEffect(() => {
    setExtraPayments([])
    setNextCursor(baseData?.meta.nextCursor ?? null)
  }, [baseData])

  const payments = [...(baseData?.data ?? []), ...extraPayments]
  const meta = {
    total: baseData?.meta.total ?? 0,
    hasMore: !!nextCursor,
    nextCursor,
  }

  async function loadMore() {
    if (!nextCursor || !businessId) return
    setIsLoadingMore(true)
    try {
      const res = await api
        .get<PaymentsResponse & ApiResponse<Payment[]>>(
          `/api/v1/businesses/${businessId}/payments?${buildParams(nextCursor)}`,
        )
        .then((r) => r as unknown as PaymentsResponse)
      setExtraPayments((prev) => [...prev, ...res.data])
      setNextCursor(res.meta.nextCursor)
    } finally {
      setIsLoadingMore(false)
    }
  }

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setQ(value), 400)
  }

  function clearFilters() {
    setStatus('')
    setFrom('')
    setTo('')
    setSearchInput('')
    setQ('')
  }

  const hasFilters = status !== '' || from !== '' || to !== '' || q !== ''

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Pagos" />
      <main className="flex-1 p-6">

        {/* Búsqueda + Filtros */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Buscar</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Nombre, email, ID de MP..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-64 rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
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
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPayment(p)}
                        className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedPayment?.id === p.id ? 'bg-blue-50' : ''}`}
                      >
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
                        <td className="px-6 py-4 text-muted">{formatPaymentMethod(p.paymentMethod)}</td>
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

      {/* Panel de detalle con AFIP */}
      {selectedPayment && businessId && (
        <DetailPanel
          payment={selectedPayment}
          businessId={businessId}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  )
}
