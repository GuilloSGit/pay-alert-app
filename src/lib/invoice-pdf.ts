export interface InvoiceData {
  id: string
  planName: string
  amountARS: string
  periodStart: string
  periodEnd: string
  paidAt: string | null
  mpPaymentId: string | null
  businessName: string
  ownerName: string
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function fmtAmount(amount: string): string {
  return Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function generateInvoicePdf(invoice: InvoiceData): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20

  // ─── Header ───────────────────────────────────────────────────────────────
  doc.setFillColor(4, 12, 7) // #040c07
  doc.rect(0, 0, pageW, 38, 'F')

  doc.setFillColor(5, 150, 105) // #059669
  doc.roundedRect(margin, 10, 18, 18, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text('🔔', margin + 9, 21, { align: 'center' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Pay Alert', margin + 22, 22)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(156, 163, 175)
  doc.text('pay-alert.com.ar', pageW - margin, 22, { align: 'right' })

  // ─── Title ────────────────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Comprobante de pago', margin, 58)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`N.° ${invoice.id}`, margin, 65)

  // ─── Business info ────────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('Comercio', pageW - margin, 58, { align: 'right' })
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.businessName, pageW - margin, 65, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(invoice.ownerName, pageW - margin, 71, { align: 'right' })

  // ─── Divider ──────────────────────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(margin, 78, pageW - margin, 78)

  // ─── Detail table ─────────────────────────────────────────────────────────
  const rows: [string, string][] = [
    ['Servicio', `Pay Alert — Plan ${invoice.planName}`],
    ['Período', `${fmtDate(invoice.periodStart)} — ${fmtDate(invoice.periodEnd)}`],
    ['Fecha de pago', invoice.paidAt ? fmtDate(invoice.paidAt) : '—'],
    ['N.° de pago MP', invoice.mpPaymentId ?? '—'],
    ['Estado', 'Pagado'],
  ]

  let y = 92
  const col1 = margin
  const col2 = margin + 80

  doc.setFontSize(10)
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(label, col1, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(value, col2, y)
    y += 10
  }

  // ─── Total box ───────────────────────────────────────────────────────────
  y += 8
  doc.setFillColor(240, 253, 244) // green-50
  doc.setDrawColor(187, 247, 208) // green-200
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, pageW - margin * 2, 20, 3, 3, 'FD')

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(22, 101, 52) // green-900
  doc.text('Total abonado', margin + 8, y + 13)

  doc.setFontSize(15)
  doc.setTextColor(5, 150, 105) // green-600
  doc.text(`$ ${fmtAmount(invoice.amountARS)} ARS`, pageW - margin - 8, y + 13, { align: 'right' })

  // ─── Note ────────────────────────────────────────────────────────────────
  y += 36
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  const note = [
    'Este comprobante no es un comprobante fiscal (factura A/B/C). El comprobante fiscal',
    'oficial es emitido por Mercado Pago al momento del pago bajo el N.° de pago indicado.',
    'Ante consultas: soporte@pay-alert.com.ar',
  ]
  for (const line of note) {
    doc.text(line, pageW / 2, y, { align: 'center' })
    y += 5
  }

  // ─── Footer ──────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(248, 250, 252)
  doc.rect(0, pageH - 18, pageW, 18, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.line(0, pageH - 18, pageW, pageH - 18)
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(
    'Pay Alert · Integración oficial con Mercado Pago · Producto argentino',
    pageW / 2,
    pageH - 8,
    { align: 'center' },
  )

  const filename = `factura-pay-alert-${invoice.id.slice(-8)}.pdf`
  doc.save(filename)
}
