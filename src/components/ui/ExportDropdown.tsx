'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Spinner } from './Spinner'
import {
  type ExportFormat,
  fetchExportRows,
  downloadCsvBlob,
  downloadXlsx,
  downloadPdf,
  buildXlsxDataUrl,
} from '@/lib/export-payments'
import { getUser } from '@/lib/auth'

interface Props {
  businessName: string
  /** Nombre del archivo sin extensión, ej: "cierres-06-dic-2025-a-15-may-2026" */
  filename: string
  locked?: boolean
  noPermission?: boolean
  // Client-side: rows ya cargadas (ej: cierres)
  rows?: string[][]
  pdfFn?: (rows: string[][], filename: string, businessName: string, userName: string) => Promise<void>
  // Server-side: fetch desde BE (ej: pagos)
  businessId?: string
  buildParams?: () => URLSearchParams
}

const OPTIONS: { format: ExportFormat; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    format: 'csv',
    label: 'CSV',
    desc: 'Compatible con Excel, Sheets y más',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    format: 'xlsx',
    label: 'Excel (XLSX)',
    desc: 'Libro de Excel con hoja de info',
    icon: (
      <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    format: 'pdf',
    label: 'PDF empresarial',
    desc: 'Con membrete, comercio y fecha',
    icon: (
      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export function ExportDropdown({
  businessName,
  filename,
  locked = false,
  noPermission = false,
  rows: preloadedRows,
  pdfFn,
  businessId,
  buildParams,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Pre-computar data URLs para CSV/XLSX cuando los rows ya están en memoria.
  // Esto evita usar a.click() desde JS (que Chrome puede silenciar) — el
  // usuario clickea directamente el <a href download>, garantizando el download.
  const xlsxDataUrl = useMemo(
    () => (preloadedRows ? buildXlsxDataUrl(preloadedRows, businessName) : null),
    [preloadedRows, businessName],
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleExport(format: ExportFormat) {
    setOpen(false)
    setLoading(format)
    setError(null)
    const run = async () => {
      const exportRows = preloadedRows
        ? preloadedRows
        : await fetchExportRows(businessId!, buildParams!())
      if (format === 'csv') {
        const csv = exportRows.map((r) => r.join(',')).join('\n')
        downloadCsvBlob(csv, `${filename}.csv`)
      } else if (format === 'xlsx') {
        downloadXlsx(exportRows, `${filename}.xlsx`, businessName)
      } else {
        const userName = getUser()?.name ?? ''
        const fn = pdfFn ?? downloadPdf
        await fn(exportRows, `${filename}.pdf`, businessName, userName)
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    run()
      .catch((e) => {
        console.error('[ExportDropdown]', e)
        setError('No se pudo exportar. Intentá de nuevo.')
        setTimeout(() => setError(null), 6000)
      })
      .finally(() => setLoading(null))
  }

  const downloadIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )

  if (noPermission) {
    return (
      <div className="relative shrink-0">
        <button
          disabled
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted opacity-60 cursor-not-allowed"
        >
          {downloadIcon}
          Exportar
        </button>
        {showTooltip && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg">
            <p className="text-xs font-medium text-foreground">Sin permiso para exportar</p>
            <p className="mt-0.5 text-xs text-muted">Tu rol no permite exportar datos.</p>
          </div>
        )}
      </div>
    )
  }

  if (locked) {
    return (
      <div className="relative shrink-0">
        <button
          disabled
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted opacity-60 cursor-not-allowed"
        >
          {downloadIcon}
          Exportar
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Profesional
          </span>
        </button>
        {showTooltip && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg">
            <p className="text-xs font-medium text-foreground">Disponible en Plan Profesional</p>
            <p className="mt-0.5 text-xs text-muted">Exportá tus datos en CSV, Excel o PDF empresarial.</p>
          </div>
        )}
      </div>
    )
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
          <><Spinner size="sm" />Exportando...</>
        ) : success ? (
          <>
            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-700">Descargado</span>
          </>
        ) : (
          <>
            {downloadIcon}
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
          {OPTIONS.map(({ format, label, desc, icon }) => {
            const commonContent = (
              <>
                <span className="shrink-0 text-muted">{icon}</span>
                <span>
                  <span className="block text-sm font-medium text-foreground">{label}</span>
                  <span className="block text-xs text-muted">{desc}</span>
                </span>
              </>
            )
            const commonClass = 'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface first-of-type:rounded-t-xl last-of-type:rounded-b-xl'

            // CSV con rows pre-cargadas: patrón original — a.click() sin body.appendChild,
            // llamado directo desde el onClick del button (sin capas async intermedias).
            if (format === 'csv' && preloadedRows) {
              return (
                <button
                  key={format}
                  className={commonClass}
                  onClick={() => {
                    const csv = preloadedRows.map((r) => r.join(',')).join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${filename}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                    setOpen(false)
                    setSuccess(true)
                    setTimeout(() => setSuccess(false), 3000)
                  }}
                >
                  {commonContent}
                </button>
              )
            }

            // XLSX con rows: <a href data-url download> — click directo del usuario
            if (format === 'xlsx' && xlsxDataUrl) {
              return (
                <a
                  key={format}
                  href={xlsxDataUrl}
                  download={`${filename}.xlsx`}
                  onClick={() => {
                    setOpen(false)
                    setSuccess(true)
                    setTimeout(() => setSuccess(false), 3000)
                  }}
                  className={commonClass}
                >
                  {commonContent}
                </a>
              )
            }

            return (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className={commonClass}
              >
                {commonContent}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
