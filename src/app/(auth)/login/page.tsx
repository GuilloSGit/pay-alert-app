'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api, ApiError } from '@/lib/api'
import { saveSession } from '@/lib/auth'
import type { ApiResponse, User } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      const res = await api.post<ApiResponse<{ accessToken: string; user: User }>>(
        '/api/v1/auth/login',
        { email, password },
        { skipAuth: true },
      )
      saveSession(res.data.accessToken, res.data.user)
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Email o contraseña incorrectos.' : err.message)
      } else {
        setError('Error de conexión. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-foreground mb-1">Iniciar sesión</h2>
      <p className="text-sm text-muted mb-6">Ingresá a tu cuenta de Pay Alert</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Registrate
        </Link>
      </p>
    </Card>
  )
}
