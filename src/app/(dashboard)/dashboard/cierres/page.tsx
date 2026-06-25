'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from '@/components/layout/PageShell'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ExportDropdown } from '@/components/ui/ExportDropdown'
import { downloadCierresPdf } from '@/lib/export-payments'
import { api } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { Plan } from '@/types'

interface SubscriptionPlan {
  closures: boolean
  dataExport: boolean
  historyDays: number
  name: string
  slug: Plan['slug']
}

interface ClosureMethod { method: string | null; totalAmount: string; count: number }
interface ClosureDay { date: string; totalAmount: string; count: number; methods: ClosureMethod[] }

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  money_transfer: 'Transferencia', regular_payment: 'QR / Cobro', account_money: 'Cuenta MP',
  debit_card: 'Tarjeta débito', credit_card: 'Tarjeta crédito', bank_transfer: 'Transferencia bancaria',
  ticket: 'Cupón / Efectivo', atm: 'ATM', digital_currency: 'Billetera virtual', prepaid_card: 'Tarjeta prepago',
}

function formatMethod(method: string | null) {
  return PAYMENT_METHOD_LABELS[method ?? ''] ?? method ?? 'Sin método'
}

function formatAmount(amount: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(amount))
}

function minDateForPlan(historyDays: number): string {
  if (historyDays === -1) return ''
  const d = new Date()
  d.setDate(d.getDate() - historyDays)
  return d.toISOString().split('T')[0]
}

function buildCierresRows(days: ClosureDay[]): string[][] {
  return [
    ['Fecha', 'Método de pago', 'Pagos', 'Total ARS'],
    ...days.flatMap((day) =>
      day.methods.map((m) => [
        day.date,
        PAYMENT_METHOD_LABELS[m.method ?? ''] ?? m.method ?? 'Sin método',
        String(m.count),
        Number(m.totalAmount).toFixed(2),
      ]),
    ),
  ]
}

const MONTH_NAMES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function buildExportFilename(from: string, to: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return `${String(d.getDate()).padStart(2, '0')}-${MONTH_NAMES[d.getMonth()]}-${d.getFullYear()}`
  }
  if (from && to) return `cierres-${fmt(from)}-a-${fmt(to)}`
  if (from) return `cierres-desde-${fmt(from)}`
  if (to) return `cierres-hasta-${fmt(to)}`
  return `cierres-${new Date().toISOString().slice(0, 10)}`
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00Z')
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (dateStr === todayStr) return 'Hoy'
  if (dateStr === yesterdayStr) return 'Ayer'

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// ─── Placeholder borroso (plan sin closures) ──────────────────────────────────

const BLUR_ROWS: ClosureDay[] = [
  {
    date: '2026-06-18',
    totalAmount: '83200.00',
    count: 24,
    methods: [
      { method: 'account_money', totalAmount: '45000.00', count: 13 },
      { method: 'credit_card', totalAmount: '28200.00', count: 8 },
      { method: 'bank_transfer', totalAmount: '10000.00', count: 3 },
    ],
  },
  {
    date: '2026-06-17',
    totalAmount: '61500.00',
    count: 17,
    methods: [
      { method: 'account_money', totalAmount: '38000.00', count: 11 },
      { method: 'debit_card', totalAmount: '23500.00', count: 6 },
    ],
  },
  {
    date: '2026-06-16',
    totalAmount: '49800.00',
    count: 12,
    methods: [
      { method: 'account_money', totalAmount: '32000.00', count: 8 },
      { method: 'credit_card', totalAmount: '17800.00', count: 4 },
    ],
  },
]

function LockedOverlay({ planName }: { planName?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/60 backdrop-blur-[2px]">
      <div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-lg">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground">Cierres diarios</h3>
        <p className="mb-4 text-sm text-muted">
          {planName
            ? `Esta función requiere el plan Profesional o superior. Tu plan actual es ${planName}.`
            : 'Esta función requiere el plan Profesional o superior.'}
        </p>
        <a
          href="/dashboard/settings#suscripcion"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          Ver planes
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  )
}

// ─── Tabla de cierres ─────────────────────────────────────────────────────────

function ClosureTable({ days, blur }: { days: ClosureDay[]; blur?: boolean }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  function toggle(date: string) {
    setExpanded((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  return (
    <div className={`space-y-3 ${blur ? 'select-none' : ''}`}>
      {days.map((day) => {
        const isOpen = expanded[day.date] ?? true
        return (
          <div key={day.date} className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              onClick={() => !blur && toggle(day.date)}
              className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${!blur && 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold capitalize text-foreground">{formatDate(day.date)}</p>
                  <p className="text-xs text-muted">{day.count} {day.count === 1 ? 'pago aprobado' : 'pagos aprobados'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-base font-bold text-foreground">{formatAmount(day.totalAmount)}</span>
                {!blur && (
                  <svg
                    className={`h-4 w-4 flex-shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/70">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Método</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Pagos</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {day.methods.map((m, i) => (
                      <tr key={i} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-medium text-foreground">{formatMethod(m.method)}</td>
                        <td className="px-5 py-3 text-right text-muted">{m.count}</td>
                        <td className="px-5 py-3 text-right font-semibold text-foreground">{formatAmount(m.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50/70">
                      <td className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">Total del día</td>
                      <td className="px-5 py-2.5 text-right text-sm font-semibold text-foreground">{day.count}</td>
                      <td className="px-5 py-2.5 text-right text-sm font-bold text-foreground">{formatAmount(day.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CierresPage() {
  const { businessId, businessName, role } = useActiveBusiness()

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['subscription-features', businessId],
    queryFn: async () => {
      const res = await api.get<{ data: { plan: SubscriptionPlan } }>(
        `/api/v1/businesses/${businessId}/subscription`,
      )
      return res.data
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  })

  const planFeatures = subData?.plan
  const hasClosures = planFeatures?.closures === true
  const hasExport = planFeatures?.dataExport === true
  const historyDays = planFeatures?.historyDays ?? 30
  const minDate = hasClosures ? minDateForPlan(historyDays) : ''

  const fromISO = from ? `${from}T00:00:00.000-03:00` : undefined
  const toISO = to ? `${to}T23:59:59.999-03:00` : undefined

  const { data: closuresData } = useQuery({
    queryKey: ['closures', businessId, from, to],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (fromISO) params.set('from', fromISO)
      if (toISO) params.set('to', toISO)
      const qs = params.toString()
      const res = await api.get<{ data: ClosureDay[] }>(
        `/api/v1/businesses/${businessId}/closures${qs ? `?${qs}` : ''}`,
      )
      return res.data
    },
    enabled: !!businessId && hasClosures,
  })

  const days = closuresData ?? []

  if (subLoading) {
    return (
      <PageShell title="Cierres">
        <div className="flex h-48 items-center justify-center">
          <Spinner />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Cierres">
      <div className="space-y-6">

        {/* Filtros de fecha + botón export */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Desde</label>
            <input
              type="date"
              value={from}
              min={minDate}
              max={to || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFrom(e.target.value)}
              disabled={!hasClosures}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Hasta</label>
            <input
              type="date"
              value={to}
              min={minDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setTo(e.target.value)}
              disabled={!hasClosures}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
          {(from || to) && hasClosures && (
            <button
              onClick={() => { setFrom(''); setTo('') }}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:bg-gray-100 hover:text-foreground"
            >
              Limpiar
            </button>
          )}

          <div className="ml-auto">
            <ExportDropdown
              businessName={businessName ?? ''}
              filename={buildExportFilename(from, to)}
              rows={buildCierresRows(days)}
              pdfFn={downloadCierresPdf}
              noPermission={role === 'OBSERVER'}
              locked={!hasExport}
            />
          </div>
        </div>

        {/* Nota de límite de historial según plan */}
        {hasClosures && historyDays !== -1 && (
          <p className="text-xs text-muted">
            Tu plan permite ver hasta <strong>{historyDays} días</strong> de historial.
          </p>
        )}

        {/* Contenido */}
        <div className="relative">
          {!hasClosures && (
            <LockedOverlay planName={planFeatures?.name} />
          )}

          {!hasClosures ? (
            <ClosureTable days={BLUR_ROWS} blur />
          ) : closuresData === undefined ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner />
            </div>
          ) : days.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted">No hay pagos aprobados en el período seleccionado.</p>
            </Card>
          ) : (
            <ClosureTable days={days} />
          )}
        </div>

        {/* Info de frecuencia de email */}
        {hasClosures && (
          <p className="text-xs text-muted">
            Podés configurar la frecuencia del resumen por email en{' '}
            <a href="/dashboard/settings" className="underline underline-offset-2 hover:text-foreground">
              Configuración
            </a>
            .
          </p>
        )}
      </div>
    </PageShell>
  )
}
