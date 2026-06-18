'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from '@/components/layout/PageShell'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import { generateInvoicePdf } from '@/lib/invoice-pdf'

interface Invoice {
  id: string
  status: string
  amountARS: string
  planName: string
  periodStart: string
  periodEnd: string
  paidAt: string | null
  mpPaymentId: string | null
  createdAt: string
}

interface InvoicesResponse {
  data: Invoice[]
  meta: { total: number; page: number; pageSize: number }
}

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagada',
  PENDING: 'Pendiente',
  FAILED: 'Fallida',
  REFUNDED: 'Reembolsada',
}

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-50 text-green-700 border-green-200',
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-gray-50 text-gray-700 border-gray-200',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function fmtAmount(amount: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(amount))
}

export default function FacturacionPage() {
  const { businessId, businessName, role } = useActiveBusiness()
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState<string | null>(null)
  const pageSize = 12

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', businessId, page],
    queryFn: () =>
      api
        .get<InvoicesResponse>(
          `/api/v1/businesses/${businessId}/invoices?page=${page}&pageSize=${pageSize}`,
        )
        .then((r) => r),
    enabled: !!businessId,
  })

  const invoices = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  async function handleDownload(inv: Invoice) {
    if (!businessName) return
    setDownloading(inv.id)
    try {
      await generateInvoicePdf({
        id: inv.id,
        planName: inv.planName,
        amountARS: inv.amountARS,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        paidAt: inv.paidAt,
        mpPaymentId: inv.mpPaymentId,
        businessName,
        ownerName: '',
      })
    } finally {
      setDownloading(null)
    }
  }

  if (role !== 'OWNER') {
    return (
      <PageShell title="Facturación">
        <Card className="p-12 text-center">
          <p className="text-muted">Solo el dueño del comercio puede ver el historial de facturación.</p>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell title="Facturación">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Historial de pagos de tu suscripción a Pay Alert. Cada comprobante tiene membrete y detalle del servicio.
        </p>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : invoices.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted">Aún no tenés facturas. Aparecerán aquí cuando se procese el primer pago de tu suscripción.</p>
          </Card>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/70">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Fecha</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Plan</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Período</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Monto</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Estado</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 text-muted">{fmtDate(inv.createdAt)}</td>
                      <td className="px-5 py-3.5 font-medium text-foreground">{inv.planName}</td>
                      <td className="px-5 py-3.5 text-muted">
                        {fmtDate(inv.periodStart)} — {fmtDate(inv.periodEnd)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                        {fmtAmount(inv.amountARS)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[inv.status] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {STATUS_LABELS[inv.status] ?? inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {inv.status === 'PAID' && (
                          <button
                            onClick={() => handleDownload(inv)}
                            disabled={downloading === inv.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-gray-50 hover:text-foreground disabled:opacity-50"
                          >
                            {downloading === inv.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            Descargar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="space-y-3 sm:hidden">
              {invoices.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{inv.planName}</p>
                      <p className="text-xs text-muted">{fmtDate(inv.periodStart)} — {fmtDate(inv.periodEnd)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[inv.status] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-base font-bold text-foreground">{fmtAmount(inv.amountARS)}</p>
                    {inv.status === 'PAID' && (
                      <button
                        onClick={() => handleDownload(inv)}
                        disabled={downloading === inv.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-gray-50 disabled:opacity-50"
                      >
                        {downloading === inv.id ? <Spinner size="sm" /> : 'Descargar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted">
                <span>{total} facturas en total</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-gray-50 disabled:opacity-40"
                  >
                    ← Anterior
                  </button>
                  <span className="px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-gray-50 disabled:opacity-40"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}
