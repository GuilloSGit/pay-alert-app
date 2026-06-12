'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { Payment } from '@/types'

interface DashboardSummary {
  paymentsToday: number
  totalThisMonth: { amount: string; count: number }
  activeMembers: number
  subscription: {
    planName: string
    planSlug: string
    status: string
    currentPeriodEnd: string
    trialEndsAt: string | null
  } | null
  recentPayments: Payment[]
}

interface SummaryResponse {
  data: DashboardSummary
}

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

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  TRIALING: 'Período de prueba',
  ACTIVE: 'Activo',
  PAST_DUE: 'Pago pendiente',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
}

function formatAmount(amount: string, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(Number(amount))
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function DashboardPage() {
  const { businessId, role } = useActiveBusiness()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isManager = role === 'OWNER' || role === 'ADMIN'

  useEffect(() => {
    if (!businessId) return
    api
      .get<SummaryResponse>(`/api/v1/businesses/${businessId}/summary`)
      .then((res) => setSummary(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [businessId])

  const skeleton = (
    <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
  )

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Dashboard" />
      <main className="flex-1 p-6">

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Pagos hoy — todos los roles */}
          <Card className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted">Pagos hoy</p>
            {isLoading ? skeleton : (
              <p className="text-2xl font-bold text-foreground">
                {summary?.paymentsToday ?? 0}
              </p>
            )}
            <p className="text-xs text-muted">aprobados</p>
          </Card>

          {/* Total del mes — todos los roles */}
          <Card className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted">Total del mes</p>
            {isLoading ? skeleton : (
              <p className="text-2xl font-bold text-foreground">
                {summary ? formatAmount(summary.totalThisMonth.amount) : '$0'}
              </p>
            )}
            <p className="text-xs text-muted">
              {summary ? `${summary.totalThisMonth.count} pagos aprobados` : '—'}
            </p>
          </Card>

          {/* Miembros activos — solo OWNER / ADMIN */}
          <Card className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted">Miembros activos</p>
            {isLoading ? skeleton : isManager ? (
              <p className="text-2xl font-bold text-foreground">
                {summary?.activeMembers ?? '—'}
              </p>
            ) : (
              <p className="text-2xl font-bold text-muted">—</p>
            )}
            <p className="text-xs text-muted">
              {isManager ? 'en este comercio' : 'sin acceso'}
            </p>
          </Card>

          {/* Suscripción — solo OWNER */}
          <Card className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted">Suscripción</p>
            {isLoading ? skeleton : role === 'OWNER' ? (
              summary?.subscription ? (
                <>
                  <p className="text-lg font-bold text-foreground leading-tight">
                    {summary.subscription.planName}
                  </p>
                  <span className={`mt-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    summary.subscription.status === 'ACTIVE' || summary.subscription.status === 'TRIALING'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {SUBSCRIPTION_STATUS_LABELS[summary.subscription.status] ?? summary.subscription.status}
                  </span>
                </>
              ) : (
                <p className="text-sm text-muted">Sin plan activo</p>
              )
            ) : (
              <p className="text-2xl font-bold text-muted">—</p>
            )}
          </Card>
        </div>

        {/* Últimos pagos — todos los roles */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <CardHeader className="mb-0">
                <CardTitle>Últimos pagos</CardTitle>
                <CardDescription>Los 5 cobros más recientes del comercio.</CardDescription>
              </CardHeader>
            </div>
            <Link
              href="/dashboard/payments"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !summary?.recentPayments.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-muted">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">Sin pagos aún</p>
              <p className="mt-1 text-sm text-muted">
                Conectá tu comercio a Mercado Pago para empezar a recibir alertas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Pagador</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summary.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-foreground tabular-nums">
                        {formatAmount(p.amount, p.currency)}
                      </td>
                      <td className="px-6 py-3 text-muted">
                        {p.payerName ?? p.payerEmail ?? '—'}
                      </td>
                      <td className="px-6 py-3 text-muted whitespace-nowrap">
                        {formatDate(p.paidAt ?? p.receivedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </main>
    </div>
  )
}
