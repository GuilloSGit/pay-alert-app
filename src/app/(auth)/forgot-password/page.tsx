'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/v1/auth/forgot-password', { email }, { skipAuth: true })
    } finally {
      // Siempre mostramos éxito — no revelar si el email existe
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Revisá tu email</h2>
            <p className="mt-2 text-sm text-muted">
              Si existe una cuenta para <strong className="text-foreground">{email}</strong>, te enviamos un enlace para restablecer tu contraseña. Expira en 30 minutos.
            </p>
          </div>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-foreground mb-1">Recuperar contraseña</h2>
      <p className="text-sm text-muted mb-6">
        Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="vos@ejemplo.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Enviar enlace
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Recordaste tu contraseña?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </Card>
  )
}
