'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'

interface UserMe {
  quietHoursStart: number | null
  quietHoursEnd: number | null
  timezone: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function hourLabel(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

export function QuietHoursSection() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ data: UserMe }>('/api/v1/users/me').then((r) => r.data),
  })

  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [start, setStart] = useState<number>(22)
  const [end, setEnd] = useState<number>(8)
  const [initialized, setInitialized] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user && !initialized) {
    setEnabled(user.quietHoursStart !== null)
    setStart(user.quietHoursStart ?? 22)
    setEnd(user.quietHoursEnd ?? 8)
    setInitialized(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      await api.put('/api/v1/users/me', {
        quietHoursStart: enabled ? start : null,
        quietHoursEnd: enabled ? end : null,
      })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      setSuccess(true)
    } catch {
      setError('No se pudo guardar la configuración. Intentá de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  const isOn = enabled ?? false

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horario silencioso</CardTitle>
        <CardDescription>
          No recibirás notificaciones push durante el período configurado. El WebSocket sigue activo si tenés la app abierta.
        </CardDescription>
      </CardHeader>

      {isLoading || enabled === null ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Activar horario silencioso</p>
              <p className="text-xs text-muted">Hora de Argentina (UTC-3)</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOn}
              onClick={() => { setEnabled(!isOn); setSuccess(false) }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isOn ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOn ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Time selectors */}
          {isOn && (
            <div className="flex items-center gap-4">
              <div className="flex flex-1 flex-col gap-1">
                <label htmlFor="quiet-start" className="text-xs font-medium text-foreground">
                  Desde
                </label>
                <select
                  id="quiet-start"
                  value={start}
                  onChange={(e) => { setStart(Number(e.target.value)); setSuccess(false) }}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <label htmlFor="quiet-end" className="text-xs font-medium text-foreground">
                  Hasta
                </label>
                <select
                  id="quiet-end"
                  value={end}
                  onChange={(e) => { setEnd(Number(e.target.value)); setSuccess(false) }}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5 flex-shrink-0 text-xs text-muted">
                {start === end ? (
                  <span className="text-amber-600">Inicio = fin: siempre silencioso</span>
                ) : start > end ? (
                  <span>
                    {hourLabel(start)} → {hourLabel(end)} (+1 día)
                  </span>
                ) : (
                  <span>
                    {hourLabel(start)} → {hourLabel(end)}
                  </span>
                )}
              </div>
            </div>
          )}

          {!isOn && (
            <p className="text-sm text-muted">
              Las notificaciones push se envían a cualquier hora.
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Configuración guardada correctamente.
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" className="border-white" />
                  Guardando...
                </span>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      )}
    </Card>
  )
}
