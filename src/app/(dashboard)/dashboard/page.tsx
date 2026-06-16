'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
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

  const { data: summary, isLoading } = useQuery({
    queryKey: ['summary', businessId],
    queryFn: () =>
      api.get<SummaryResponse>(`/api/v1/businesses/${businessId}/summary`).then((r) => r.data),
    enabled: !!businessId,
  })

  const isManager = role === 'OWNER' || role === 'ADMIN'

  return (
    <PageShell title="Dashboard">

      {/* Stats cards */}
      <div className={`grid gap-4 mb-6 ${isManager ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
        <StatCard label="Pagos recibidos hoy" caption="aprobados" isLoading={isLoading}>
          <p className="text-2xl font-bold text-foreground">{summary?.paymentsToday ?? 0}</p>
        </StatCard>

        <StatCard
          label="Total del mes"
          caption={summary ? `${summary.totalThisMonth.count} pagos aprobados` : '—'}
          isLoading={isLoading}
        >
          <p className="text-2xl font-bold text-foreground">
            {summary ? formatAmount(summary.totalThisMonth.amount) : '$0'}
          </p>
        </StatCard>

        {isManager && (
          <StatCard label="Miembros activos" caption="en este comercio" isLoading={isLoading}>
            <p className="text-2xl font-bold text-foreground">{summary?.activeMembers ?? '—'}</p>
          </StatCard>
        )}

        {isManager && (
          <StatCard label="Suscripción" isLoading={isLoading}>
            {role === 'OWNER' ? (
              summary?.subscription ? (
                <>
                  <p className="text-lg font-bold text-foreground leading-tight">
                    {summary.subscription.planName}
                  </p>
                  <Badge className={`mt-1 w-fit px-2 ${
                    summary.subscription.status === 'ACTIVE' || summary.subscription.status === 'TRIALING'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {SUBSCRIPTION_STATUS_LABELS[summary.subscription.status] ?? summary.subscription.status}
                  </Badge>
                </>
              ) : (
                <p className="text-sm text-muted">Sin plan activo</p>
              )
            ) : (
              <p className="text-sm text-muted">Solo el dueño puede verla</p>
            )}
          </StatCard>
        )}
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
            <Spinner />
          </div>
        ) : !summary?.recentPayments.length ? (
          <EmptyState
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="Sin pagos aún"
            description="Conectá tu comercio a Mercado Pago para empezar a recibir alertas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Badge className={STATUS_CLASSES[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-foreground tabular-nums">
                      {formatAmount(p.amount, p.currency)}
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

    </PageShell>
  )
}
