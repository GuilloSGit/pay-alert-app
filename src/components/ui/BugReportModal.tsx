'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { getAccessToken, getUser } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const MAX_FILES = 5
const MAX_SIZE = 8 * 1024 * 1024 // 8 MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'text/plain', 'text/csv']

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Baja', color: 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100 data-[active]:bg-green-100 data-[active]:border-green-500 data-[active]:ring-1 data-[active]:ring-green-500' },
  { value: 'MEDIUM', label: 'Media', color: 'text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100 data-[active]:bg-yellow-100 data-[active]:border-yellow-500 data-[active]:ring-1 data-[active]:ring-yellow-500' },
  { value: 'HIGH', label: 'Alta', color: 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100 data-[active]:bg-orange-100 data-[active]:border-orange-500 data-[active]:ring-1 data-[active]:ring-orange-500' },
  { value: 'CRITICAL', label: 'Crítica', color: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 data-[active]:bg-red-100 data-[active]:border-red-500 data-[active]:ring-1 data-[active]:ring-red-500' },
] as const

function sectionFromPathname(pathname: string): string {
  if (pathname.startsWith('/dashboard/payments')) return 'pagos'
  if (pathname.startsWith('/dashboard/businesses')) return 'comercio'
  if (pathname.startsWith('/dashboard/members')) return 'miembros'
  if (pathname.startsWith('/dashboard/settings')) return 'configuracion'
  if (pathname === '/dashboard') return 'dashboard'
  return 'general'
}

interface AttachedFile {
  file: File
  preview: string | null // data URL para imágenes
}

interface Props {
  onClose: () => void
}

export function BugReportModal({ onClose }: Props) {
  const pathname = usePathname()
  const user = getUser()
  const isAuthed = !!user

  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('')
  const [expected, setExpected] = useState('')
  const [frequency, setFrequency] = useState<'ALWAYS' | 'SOMETIMES' | 'ONCE' | ''>('')
  const [email, setEmail] = useState('')
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cerrar con ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function addFiles(incoming: FileList | File[]) {
    setFileError(null)
    const arr = Array.from(incoming)
    const valid: AttachedFile[] = []

    for (const f of arr) {
      if (!ACCEPTED.includes(f.type)) {
        setFileError('Solo se permiten imágenes (jpg, png, webp, gif) y texto (txt, csv).')
        continue
      }
      if (f.size > MAX_SIZE) {
        setFileError(`"${f.name}" supera el límite de 8 MB.`)
        continue
      }
      if (files.length + valid.length >= MAX_FILES) {
        setFileError(`Máximo ${MAX_FILES} archivos.`)
        break
      }
      const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : null
      valid.push({ file: f, preview })
    }

    setFiles((prev) => [...prev, ...valid])
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      const copy = [...prev]
      if (copy[index].preview) URL.revokeObjectURL(copy[index].preview!)
      copy.splice(index, 1)
      return copy
    })
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      addFiles(e.dataTransfer.files)
    },
    [files], // eslint-disable-line react-hooks/exhaustive-deps
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setSubmitting(true)
    setSubmitError(null)

    const fd = new FormData()
    fd.append('description', description.trim())
    fd.append('severity', severity)
    fd.append('section', sectionFromPathname(pathname))
    fd.append('url', typeof window !== 'undefined' ? window.location.href : '')
    // Combina pasos, frecuencia y comportamiento esperado en un único campo
    const stepsParts: string[] = []
    if (frequency) {
      const freqLabel = { ALWAYS: 'Siempre', SOMETIMES: 'A veces', ONCE: 'Una sola vez' }[frequency]
      stepsParts.push(`Frecuencia: ${freqLabel}`)
    }
    if (steps.trim()) stepsParts.push(`Pasos para reproducir:\n${steps.trim()}`)
    if (expected.trim()) stepsParts.push(`Comportamiento esperado:\n${expected.trim()}`)
    if (stepsParts.length) fd.append('steps', stepsParts.join('\n\n'))
    if (!isAuthed && email.trim()) fd.append('email', email.trim())
    files.forEach(({ file }) => fd.append('file', file))

    try {
      const token = getAccessToken()
      const res = await fetch(`${BASE_URL}/api/v1/bugs`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al enviar el reporte')
      setSuccessId(json.data.id)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar el reporte')
    } finally {
      setSubmitting(false)
    }
  }

  // Portal — monta fuera del sidebar para que fixed/inset-0 cubra toda la pantalla
  // (el translate en el sidebar crea un stacking context que confina a los hijos fixed)
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐛</span>
            <h2 className="text-base font-semibold text-foreground">Reportar un problema</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted transition-colors hover:bg-gray-100 hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="max-h-[80vh] overflow-y-auto">
          {successId ? (
            /* Estado de éxito */
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">¡Reporte enviado!</p>
                <p className="mt-1 text-sm text-muted">Lo revisamos lo antes posible.</p>
                <p className="mt-3 font-mono text-xs text-muted/60">{successId}</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Cerrar
              </button>
            </div>
          ) : (
            /* Formulario */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
              {/* Severidad */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Severidad</label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      data-active={severity === opt.value ? '' : undefined}
                      onClick={() => setSeverity(opt.value)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${opt.color}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  ¿Qué ocurrió? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describí el problema con el mayor detalle posible…"
                  rows={3}
                  required
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Frecuencia */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  ¿Con qué frecuencia ocurre?{' '}
                  <span className="font-normal text-muted">(opcional)</span>
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      { value: 'ALWAYS', label: 'Siempre' },
                      { value: 'SOMETIMES', label: 'A veces' },
                      { value: 'ONCE', label: 'Una sola vez' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFrequency((prev) => (prev === opt.value ? '' : opt.value))}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                        frequency === opt.value
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                          : 'border-border text-muted hover:border-primary/50 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pasos */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Pasos para reproducirlo{' '}
                  <span className="font-normal text-muted">(opcional)</span>
                </label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder={'1. Fui a Pagos\n2. Hice click en Exportar\n3. El botón quedó cargando…'}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Comportamiento esperado */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  ¿Qué esperabas que ocurriera?{' '}
                  <span className="font-normal text-muted">(opcional)</span>
                </label>
                <textarea
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  placeholder="El archivo CSV debería descargarse automáticamente…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Archivos */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Capturas o logs{' '}
                  <span className="font-normal text-muted">(opcional — máx. {MAX_FILES} archivos, 8 MB c/u)</span>
                </label>
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors ${
                    dragOver
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted hover:border-primary/50 hover:bg-gray-50'
                  }`}
                >
                  <svg className="h-6 w-6 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-xs">Arrastrá o hacé click para adjuntar</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED.join(',')}
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />

                {fileError && (
                  <p className="mt-1.5 text-xs text-red-600">{fileError}</p>
                )}

                {files.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {files.map((af, i) => (
                      <li key={i} className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2">
                        {af.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={af.preview} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200 text-xs text-muted">
                            txt
                          </div>
                        )}
                        <span className="flex-1 truncate text-xs text-foreground">{af.file.name}</span>
                        <span className="shrink-0 text-xs text-muted">
                          {(af.file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                          className="shrink-0 rounded p-0.5 text-muted hover:text-red-500"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Email — solo si no está autenticado */}
              {!isAuthed && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Tu email{' '}
                    <span className="font-normal text-muted">(opcional — para recibir respuesta)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {submitError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</p>
              )}

              {/* Footer */}
              <div className="flex gap-3 border-t border-border pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Enviando…' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
