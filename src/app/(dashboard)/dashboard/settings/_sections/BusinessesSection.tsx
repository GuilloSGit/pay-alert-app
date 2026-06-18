'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { api, ApiError } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'

export function BusinessesSection() {
  const { businesses, businessId, refreshBusinesses } = useActiveBusiness()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setIsPending(true)
    try {
      const res = await api.post<ApiResponse<{ id: string; name: string }>>('/api/v1/businesses', { name: name.trim() })
      await refreshBusinesses(res.data.id)
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'BUSINESS_LIMIT_REACHED') {
        setError(err.message)
      } else {
        setError('No se pudo crear el comercio. Intentá de nuevo.')
      }
      setIsPending(false)
    }
  }

  function handleClose() {
    if (isPending) return
    setShowModal(false)
    setName('')
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mis comercios</CardTitle>
            <CardDescription>Comercios en los que participás.</CardDescription>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        </div>
      </CardHeader>

      {businesses.length === 0 ? (
        <p className="text-sm text-muted">No tenés comercios asociados.</p>
      ) : (
        <ul className="divide-y divide-border">
          {businesses.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted capitalize">{b.role.toLowerCase()}</p>
                </div>
              </div>
              {b.id === businessId && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Activo
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-foreground">Agregar comercio</h2>
            <p className="mt-1 text-sm text-muted">El nuevo comercio tendrá un período de prueba gratuita.</p>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              <Input
                id="new-business-name"
                label="Nombre del comercio"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null) }}
                placeholder="Ej: Mi local"
                maxLength={100}
                required
                autoFocus
              />

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-gray-100 hover:text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" className="border-white" />
                      Creando...
                    </span>
                  ) : (
                    'Crear comercio'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </Card>
  )
}
