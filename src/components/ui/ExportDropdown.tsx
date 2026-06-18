'use client'

import { useState, useRef, useEffect } from 'react'
import { Spinner } from './Spinner'
import { getAccessToken } from '@/lib/auth'
import {
  type ExportFormat,
  fetchExportRows,
  downloadCsvBlob,
  downloadXlsx,
  downloadPdf,
} from '@/lib/export-payments'

interface Props {
  businessId: string
  businessName: string
  userName: string
  buildParams: () => URLSearchParams
}

const OPTIONS: { format: ExportFormat; label: string; description: string; icon: React.ReactNode }[] = [
  {
    format: 'csv',
    label: 'CSV',
    description: 'Compatible con Excel, Sheets y más',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    format: 'xlsx',
    label: 'Excel (XLSX)',
    description: 'Libro de Excel con hoja de info',
    icon: (
      <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    format: 'pdf',
    label: 'PDF empresarial',
    description: 'Con membrete, comercio y fecha',
    icon: (
      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export function ExportDropdown({ businessId, businessName, userName, buildParams }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleExport(format: ExportFormat) {
    setOpen(false)
    setLoading(format)
    setError(null)

    try {
      const params = buildParams()
      params.delete('cursor')
      params.delete('limit')
      const token = getAccessToken()
      const date = new Date().toISOString().slice(0, 10)

      if (format === 'csv') {
        const res = await fetch(`/api/v1/businesses/${businessId}/payments/export?${params}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error(`${res.status}`)
        const text = await res.text()
        downloadCsvBlob(text, `pagos-${date}.csv`)
        return
      }

      const rows = await fetchExportRows(businessId, params, token)

      if (format === 'xlsx') {
        downloadXlsx(rows, `pagos-${date}.xlsx`, businessName)
      } else {
        await downloadPdf(rows, `pagos-${date}.pdf`, businessName, userName)
      }
    } catch {
      setError('No se pudo exportar. Intentá de nuevo.')
      setTimeout(() => setError(null), 4000)
    } finally {
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => !isLoading && setOpen((o) => !o)}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-100 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" />
            Exportando...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
            <svg
              className={`h-3.5 w-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {error && (
        <p className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {open && !isLoading && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-card shadow-lg">
          <p className="border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
            Formato de exportación
          </p>
          {OPTIONS.map(({ format, label, description, icon }) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface first-of-type:rounded-t-xl last-of-type:rounded-b-xl"
            >
              <span className="shrink-0 text-muted">{icon}</span>
              <span>
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block text-xs text-muted">{description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
