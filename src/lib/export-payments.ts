import * as XLSX from 'xlsx'
import { getAccessToken, clearSession } from './auth'
import { tryRefresh } from './api'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

const HEADERS = [
  'ID', 'ID MP', 'Monto', 'Moneda', 'Estado', 'Descripcion',
  'Pagador', 'Email Pagador', 'Metodo de Pago', 'Fecha de Pago', 'Fecha Recepcion',
]

// ── Traducciones ──────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
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

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

// Índices de columnas según HEADERS
const COL = { ESTADO: 4, METODO: 8, FECHA_PAGO: 9, FECHA_REC: 10 }

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`
  } catch {
    return iso
  }
}

function humanizeRows(rows: string[][]): string[][] {
  if (rows.length === 0) return rows
  const [header, ...data] = rows
  return [
    header,
    ...data.map((row) => {
      const r = [...row]
      if (r[COL.ESTADO]) r[COL.ESTADO] = STATUS_LABELS[r[COL.ESTADO]] ?? r[COL.ESTADO]
      if (r[COL.METODO]) r[COL.METODO] = METHOD_LABELS[r[COL.METODO]] ?? r[COL.METODO]
      if (r[COL.FECHA_PAGO]) r[COL.FECHA_PAGO] = formatDate(r[COL.FECHA_PAGO])
      if (r[COL.FECHA_REC]) r[COL.FECHA_REC] = formatDate(r[COL.FECHA_REC])
      return r
    }),
  ]
}

// ── Fetch y parse del CSV del BE ─────────────────────────────────────────────

export async function fetchExportRows(
  businessId: string,
  params: URLSearchParams,
): Promise<string[][]> {
  let token = getAccessToken()

  if (!token) {
    const refreshed = await tryRefresh()
    if (!refreshed) {
      clearSession()
      if (typeof window !== 'undefined') window.location.href = '/login'
      throw new Error('Session expired')
    }
    token = getAccessToken()
  }

  const doFetch = (tok: string | null) =>
    fetch(`${BASE_URL}/api/v1/businesses/${businessId}/payments/export?${params}`, {
      credentials: 'include',
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    })

  let res = await doFetch(token)

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (!refreshed) {
      clearSession()
      if (typeof window !== 'undefined') window.location.href = '/login'
      throw new Error('Session expired')
    }
    res = await doFetch(getAccessToken())
  }

  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  const text = await res.text()
  return humanizeRows(parseCsv(text))
}

function parseCsv(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
  return lines.map((line) => {
    const cells: string[] = []
    let inQuotes = false
    let cell = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cell += '"'; i++ }
        else { inQuotes = !inQuotes }
      } else if (ch === ',' && !inQuotes) {
        cells.push(cell); cell = ''
      } else {
        cell += ch
      }
    }
    cells.push(cell)
    return cells
  })
}

// ── CSV ───────────────────────────────────────────────────────────────────────

export function downloadCsvBlob(csvText: string, filename: string) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(URL.createObjectURL(blob), filename)
}

// ── XLSX ──────────────────────────────────────────────────────────────────────

export function downloadXlsx(rows: string[][], filename: string, businessName: string) {
  const wb = XLSX.utils.book_new()

  // Hoja de datos
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Anchos de columna aproximados
  ws['!cols'] = [
    { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
    { wch: 30 }, { wch: 22 }, { wch: 26 }, { wch: 20 }, { wch: 22 }, { wch: 22 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Pagos')

  // Hoja de metadatos
  const meta = XLSX.utils.aoa_to_sheet([
    ['Comercio', businessName],
    ['Exportado el', new Date().toLocaleString('es-AR')],
    ['Filas de datos', rows.length > 0 ? rows.length - 1 : 0],
  ])
  XLSX.utils.book_append_sheet(wb, meta, 'Info')

  XLSX.writeFile(wb, filename)
}

// ── PDF ───────────────────────────────────────────────────────────────────────

export async function downloadPdf(
  rows: string[][],
  filename: string,
  businessName: string,
  userName: string,
) {
  // Importación dinámica para no inflar el bundle inicial
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  // ── Header ──
  doc.setFillColor(5, 150, 105) // --primary #059669
  doc.rect(0, 0, 297, 18, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('Pay Alert', 10, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Historial de pagos', 40, 12)

  // ── Metadata block ──
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(businessName, 10, 28)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139) // text-muted
  doc.text(`Exportado por ${userName}`, 10, 34)
  doc.text(`${dateStr} · ${timeStr}`, 10, 39)

  const dataRows = rows.length > 1 ? rows.slice(1) : []
  doc.text(`${dataRows.length} registro${dataRows.length !== 1 ? 's' : ''}`, 10, 44)

  // ── Tabla ──
  autoTable(doc, {
    head: [HEADERS],
    body: dataRows,
    startY: 50,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 249],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { halign: 'right' },
      9: { cellWidth: 24 },
      10: { cellWidth: 24 },
    },
    margin: { left: 10, right: 10 },
  })

  // Segunda pasada: ahora que autoTable terminó, el total de páginas es correcto
  const totalPages = doc.getNumberOfPages()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Página ${i} de ${totalPages}`, pageW - 10, pageH - 5, { align: 'right' })
  }

  doc.save(filename)
}

// ── Helper ────────────────────────────────────────────────────────────────────

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
