'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { updateUser } from '@/lib/auth'

export function ProfileSection() {
  const queryClient = useQueryClient()

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () =>
      api.get<{ data: { id: string; name: string; email: string } }>('/api/v1/users/me').then((r) => r.data),
  })

  const [name, setName] = useState<string>('')
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  if (userData && !initialized) {
    setName(userData.name)
    setInitialized(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setSuccess(false)
    setIsPending(true)
    try {
      await api.put('/api/v1/users/me', { name: name.trim() })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      updateUser({ name: name.trim() })
      setSuccess(true)
    } catch {
      setError('No se pudo guardar el nombre. Intentá de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Tu nombre visible en el equipo.</CardDescription>
      </CardHeader>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="profile-email" label="Email" value={userData?.email ?? ''} disabled />
          <Input
            id="profile-name"
            label="Nombre"
            value={name}
            onChange={(e) => { setName(e.target.value); setSuccess(false) }}
            placeholder="Tu nombre"
            maxLength={100}
            required
          />

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Nombre actualizado correctamente.
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || !name.trim() || name.trim() === userData?.name}
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
