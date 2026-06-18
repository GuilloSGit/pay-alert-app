'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Spinner } from '@/components/ui/Spinner'
import { api, ApiError } from '@/lib/api'

export function SecuritySection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(): string | null {
    if (!current) return 'Ingresá tu contraseña actual.'
    if (next.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.'
    if (!/[A-Z]/.test(next)) return 'La nueva contraseña debe tener al menos una mayúscula.'
    if (!/[0-9]/.test(next)) return 'La nueva contraseña debe tener al menos un número.'
    if (next !== confirm) return 'Las contraseñas no coinciden.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      await api.post('/api/v1/auth/change-password', { currentPassword: current, newPassword: next })
      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_PASSWORD') {
        setError('La contraseña actual no es correcta.')
      } else {
        setError('No se pudo cambiar la contraseña. Intentá de nuevo.')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguridad</CardTitle>
        <CardDescription>Cambiá tu contraseña. Al confirmar, se cerrarán todas tus otras sesiones activas.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput
          id="current-password"
          label="Contraseña actual"
          value={current}
          onChange={(e) => { setCurrent(e.target.value); setError(null); setSuccess(false) }}
          autoComplete="current-password"
          required
        />
        <PasswordInput
          id="new-password"
          label="Nueva contraseña"
          value={next}
          onChange={(e) => { setNext(e.target.value); setError(null); setSuccess(false) }}
          autoComplete="new-password"
          required
        />
        <PasswordInput
          id="confirm-password"
          label="Confirmar nueva contraseña"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(null); setSuccess(false) }}
          autoComplete="new-password"
          required
        />

        <p className="text-xs text-muted">Mínimo 8 caracteres, una mayúscula y un número.</p>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Contraseña actualizada. Tus otras sesiones fueron cerradas.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !current || !next || !confirm}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="border-white" />
                Actualizando...
              </span>
            ) : (
              'Actualizar contraseña'
            )}
          </button>
        </div>
      </form>
    </Card>
  )
}
