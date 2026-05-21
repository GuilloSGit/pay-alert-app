'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api, ApiError } from '@/lib/api'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      await api.post('/api/v1/auth/register', { name, email, password }, { skipAuth: true })
      setSuccess(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Error de conexión. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">¡Registro exitoso!</h2>
          <p className="text-sm text-muted">
            Tu cuenta fue creada. Podés iniciar sesión ahora.
          </p>
          <Link
            href="/login"
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Ir al login
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-foreground mb-1">Crear cuenta</h2>
      <p className="text-sm text-muted mb-6">Empezá a recibir alertas de cobros</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          name="name"
          type="text"
          label="Nombre"
          placeholder="Tu nombre"
          autoComplete="name"
          required
        />
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="vos@ejemplo.com"
          autoComplete="email"
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          minLength={8}
          required
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </Card>
  )
}
