'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { api, ApiError } from '@/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirm = form.get('confirm') as string

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/v1/auth/reset-password', { token, password }, { skipAuth: true })
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RESET_TOKEN_INVALID') {
        setError('Este enlace de recuperación no es válido o ya expiró. Solicitá uno nuevo.')
      } else {
        setError('No se pudo actualizar la contraseña. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Contraseña actualizada</h2>
            <p className="mt-2 text-sm text-muted">
              Tu nueva contraseña está activa. Te redirigimos al inicio de sesión...
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-foreground mb-1">Nueva contraseña</h2>
      <p className="text-sm text-muted mb-6">
        Elegí una contraseña segura con al menos 8 caracteres, una mayúscula y un número.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput
          id="password"
          name="password"
          label="Nueva contraseña"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <PasswordInput
          id="confirm"
          name="confirm"
          label="Confirmá la contraseña"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          minLength={8}
        />

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <p>{error}</p>
            {error.includes('expiró') && (
              <Link href="/forgot-password" className="mt-1 block font-medium underline">
                Solicitar nuevo enlace
              </Link>
            )}
          </div>
        )}

        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Guardar contraseña
        </Button>
      </form>
    </Card>
  )
}
