'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Spinner } from '@/components/ui/Spinner'
import { ONBOARDING_DONE_KEY } from '@/components/layout/Sidebar'
import type { ApiResponse } from '@/types'

const BUSINESS_CATEGORIES = [
  { slug: 'retail',       label: 'Retail / Indumentaria' },
  { slug: 'gastronomy',   label: 'Gastronomía' },
  { slug: 'hospitality',  label: 'Hotelería / Alojamiento' },
  { slug: 'services',     label: 'Servicios profesionales' },
  { slug: 'health',       label: 'Salud / Bienestar' },
  { slug: 'beauty',       label: 'Peluquería / Estética' },
  { slug: 'kiosk',        label: 'Kiosco / Almacén' },
  { slug: 'ecommerce',    label: 'E-commerce / Venta online' },
  { slug: 'education',    label: 'Educación / Capacitación' },
  { slug: 'transport',    label: 'Transporte / Logística' },
  { slug: 'other',        label: 'Otro' },
] as const

interface Plan {
  slug: string
  name: string
  priceARS: string
  dailySummary: boolean
  alertByAmount: boolean
  dataExport: boolean
  closures: boolean
  outboundWebhooks: boolean
  maxMembers: number
}

const PLAN_FEATURES: Record<string, string[]> = {
  basic: [
    'Notificaciones en tiempo real',
    'Historial de pagos 30 días',
    'Hasta 3 miembros del equipo',
  ],
  business: [
    'Notificaciones en tiempo real',
    'Historial completo sin límite',
    'Hasta 10 miembros del equipo',
    'Alertas por monto mínimo',
    'Exportación CSV',
    'Cierres diarios por email',
    'Webhooks salientes',
  ],
}

function fmtARS(amount: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(amount))
}

const STEPS = [
  { label: 'Tu comercio' },
  { label: 'Mercado Pago' },
  { label: 'Plan' },
]

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const idx = i + 1
          const done = idx < current
          const active = idx === current
          return (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    done
                      ? 'bg-primary text-white'
                      : active
                      ? 'border-2 border-primary bg-white text-primary'
                      : 'border-2 border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  {done ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx
                  )}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium ${active ? 'text-primary' : done ? 'text-primary' : 'text-gray-400'}`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 mb-5 h-0.5 flex-1 ${idx < current ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 1: Crear comercio ───────────────────────────────────────────────────

function Step1({
  onNext,
}: {
  onNext: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !category) return
    setError(null)
    setIsPending(true)
    try {
      const res = await api.post<ApiResponse<{ id: string; name: string }>>(
        '/api/v1/businesses',
        { name: name.trim(), category },
      )
      onNext(res.data.id)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('No se pudo crear el comercio. Intentá de nuevo.')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Contanos sobre tu comercio</h2>
        <p className="mt-1 text-sm text-gray-500">Estos datos se pueden cambiar después desde Configuración.</p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor="biz-name">
          Nombre del comercio
        </label>
        <input
          id="biz-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: La Parrilla de Don Juan"
          maxLength={100}
          required
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor="biz-category">
          Rubro
        </label>
        <select
          id="biz-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="" disabled>Seleccioná el rubro</option>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={!name.trim() || !category || isPending}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? <Spinner size="sm" /> : 'Crear comercio →'}
      </button>
    </form>
  )
}

// ─── Step 2: Conectar MP ──────────────────────────────────────────────────────

function Step2({
  businessId,
  onNext,
  onSkip,
}: {
  businessId: string
  onNext: (mpConnected: boolean) => void
  onSkip: () => void
}) {
  const [token, setToken] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setError(null)
    setIsPending(true)
    try {
      await api.post(`/api/v1/businesses/${businessId}/mp-connect`, { accessToken: token.trim() })
      onNext(true)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_MP_TOKEN') {
        setError('El token es inválido o no tiene los permisos necesarios. Verificá que sea el Access Token de producción.')
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('No se pudo conectar la cuenta. Intentá de nuevo.')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Conectá tu cuenta de Mercado Pago</h2>
        <p className="mt-1 text-sm text-gray-500">
          Pay Alert necesita tu Access Token de producción para recibir las notificaciones de pagos en tiempo real.
        </p>
      </div>

      <form onSubmit={handleConnect} className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Access Token de producción</label>
            <button
              type="button"
              onClick={() => setShowGuide((v) => !v)}
              className="text-xs font-medium text-primary hover:underline"
            >
              ¿Cómo lo obtengo?
            </button>
          </div>
          <PasswordInput
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="APP_USR-..."
          />
        </div>

        {showGuide && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 space-y-1.5">
            <p className="font-semibold">Cómo obtener el Access Token:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Ingresá a <span className="font-medium">mercadopago.com.ar</span> con la cuenta del comercio</li>
              <li>Andá a <span className="font-medium">Tu negocio → Integraciones → Credenciales de producción</span></li>
              <li>Copiá el <span className="font-medium">Access Token</span> (empieza con APP_USR-)</li>
            </ol>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={!token.trim() || isPending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? <Spinner size="sm" /> : 'Conectar Mercado Pago →'}
        </button>
      </form>

      <button
        type="button"
        onClick={onSkip}
        className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
      >
        Saltar por ahora — conectar después desde Configuración
      </button>
    </div>
  )
}

// ─── Step 3: Elegir plan ──────────────────────────────────────────────────────

function Step3({
  businessId,
  onDone,
}: {
  businessId: string
  onDone: () => void
}) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [selected, setSelected] = useState('basic')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ data: Plan[] }>('/api/v1/plans')
      .then((r) => {
        setPlans(r.data)
        if (r.data.some((p) => p.slug === 'business')) setSelected('business')
      })
      .catch(() => {})
      .finally(() => setPlansLoading(false))
  }, [])

  async function handleCheckout() {
    setError(null)
    setIsPending(true)
    try {
      const res = await api.post<ApiResponse<{ checkoutUrl: string }>>(
        `/api/v1/businesses/${businessId}/subscription/checkout`,
        { planSlug: selected },
      )
      window.location.href = res.data.checkoutUrl
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('No se pudo iniciar el checkout. Intentá de nuevo.')
      }
      setIsPending(false)
    }
  }

  const selectedPlan = plans.find((p) => p.slug === selected)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Elegí tu plan</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tenés 14 días de prueba gratuita. Podés suscribirte ahora o después desde Configuración.
        </p>
      </div>

      {plansLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const isSelected = selected === plan.slug
            const features = PLAN_FEATURES[plan.slug] ?? []
            return (
              <button
                key={plan.slug}
                type="button"
                onClick={() => setSelected(plan.slug)}
                className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {plan.slug === 'business' && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                    Recomendado
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    <p className="mt-0.5 text-lg font-bold text-gray-900">
                      {fmtARS(plan.priceARS)}
                      <span className="ml-1 text-sm font-normal text-gray-500">/mes</span>
                    </p>
                  </div>
                  <div
                    className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                      isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                    }`}
                  />
                </div>
                <ul className="mt-3 space-y-1.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={isPending || plansLoading || !selectedPlan}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? <Spinner size="sm" /> : `Suscribirme al Plan ${selectedPlan?.name ?? ''} →`}
      </button>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
      >
        Continuar con período de prueba gratuita
      </button>
    </div>
  )
}

// ─── Página raíz ─────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | null>(null) // null = cargando
  const [businessId, setBusinessId] = useState<string | null>(null)

  // Detectar progreso existente y saltar al paso correcto
  useEffect(() => {
    async function detectProgress() {
      try {
        const bizRes = await api.get<ApiResponse<{ id: string; name: string }[]>>('/api/v1/businesses')
        const businesses = bizRes.data

        if (businesses.length === 0) {
          setStep(1)
          return
        }

        const biz = businesses[0]
        setBusinessId(biz.id)

        // Verificar MP
        try {
          const mpRes = await api.get<ApiResponse<{ isActive: boolean } | null>>(
            `/api/v1/businesses/${biz.id}/mp-connect`,
          )
          if (mpRes.data?.isActive) {
            // MP conectado — marcar fundamentales completos, ir al paso 3 o dashboard
            localStorage.setItem(ONBOARDING_DONE_KEY, '1')
            setStep(3)
          } else {
            setStep(2)
          }
        } catch {
          setStep(2)
        }
      } catch {
        setStep(1)
      }
    }
    void detectProgress()
  }, [router])

  function handleStep1Done(id: string) {
    setBusinessId(id)
    setStep(2)
  }

  function handleStep2Done(mpConnected: boolean) {
    if (mpConnected) localStorage.setItem(ONBOARDING_DONE_KEY, '1')
    setStep(3)
  }

  function handleDone() {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1')
    router.replace('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-center border-b border-gray-200 bg-white py-4">
        <span className="text-lg font-bold tracking-tight text-gray-900">Pay Alert</span>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-0">
        {step === null ? (
          <div className="flex items-center justify-center py-24">
            <Spinner />
          </div>
        ) : (
          <>
            <ProgressBar current={step} />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              {step === 1 && <Step1 onNext={handleStep1Done} />}
              {step === 2 && businessId && (
                <Step2
                  businessId={businessId}
                  onNext={handleStep2Done}
                  onSkip={() => handleStep2Done(false)}
                />
              )}
              {step === 3 && businessId && (
                <Step3
                  businessId={businessId}
                  onDone={handleDone}
                />
              )}
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              Paso {step} de {STEPS.length}
            </p>
          </>
        )}
      </main>
    </div>
  )
}
