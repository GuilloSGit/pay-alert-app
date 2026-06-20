'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
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
  priceARS: string | null
  isPublic: boolean
  dailySummary: boolean
  alertByAmount: boolean
  dataExport: boolean
  closures: boolean
  outboundWebhooks: boolean
  maxMembers: number
  maxBusinesses: number
}

const PLAN_FEATURES: Record<string, string[]> = {
  basic: [
    'Notificaciones en tiempo real',
    'Historial de pagos 30 días',
    '1 comercio · hasta 3 miembros',
  ],
  professional: [
    'Notificaciones en tiempo real',
    'Historial 1 año completo',
    '2 comercios · hasta 6 miembros',
    'Alertas por monto mínimo',
    'Exportación CSV',
    'Cierres diarios por email',
  ],
}

function fmtARS(amount: string | null) {
  if (amount === null) return 'A medida'
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

const MP_ONBOARDING_ERROR_MESSAGES: Record<string, string> = {
  cancelled: 'Cancelaste la autorización. Podés intentarlo de nuevo cuando quieras.',
  already_connected: 'Esta cuenta de Mercado Pago ya está conectada a otro comercio.',
  token_exchange_failed: 'Hubo un error al conectar con Mercado Pago. Intentá de nuevo.',
  invalid_state: 'El enlace de autorización expiró. Intentá de nuevo.',
}

function Step2({
  businessId,
  onSkip,
  oauthError,
}: {
  businessId: string
  onSkip: () => void
  oauthError?: string | null
}) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(
    oauthError ? (MP_ONBOARDING_ERROR_MESSAGES[oauthError] ?? 'Error al conectar con Mercado Pago.') : null,
  )

  async function handleOAuth() {
    setError(null)
    setIsPending(true)
    try {
      const res = await api.get<ApiResponse<{ url: string }>>(
        `/api/v1/businesses/${businessId}/mp-connect/oauth?returnTo=/onboarding`,
      )
      window.location.href = res.data.url
    } catch {
      setError('No se pudo iniciar la conexión. Intentá de nuevo.')
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Conectá tu cuenta de Mercado Pago</h2>
        <p className="mt-1 text-sm text-gray-500">
          Autorizá a Pay Alert para recibir notificaciones de tus pagos en tiempo real. No almacenamos tu contraseña ni accedemos a tus fondos.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={handleOAuth}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#009EE3] bg-[#009EE3] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Spinner size="sm" className="border-white" />
            Redirigiendo a Mercado Pago...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="white" />
              <path d="M8.5 20.5c.7 1.2 2 2 3.5 2h7c1.5 0 2.8-.8 3.5-2l2-3.5c.3-.5.5-1.1.5-1.7V13c0-2.2-1.8-4-4-4h-4l-1.5 2.5H17c.8 0 1.5.7 1.5 1.5S17.8 14.5 17 14.5h-1l-1.5 2.5h2.5c.8 0 1.5.7 1.5 1.5S17.8 20 17 20h-5c-.5 0-1-.2-1.3-.5L8.5 20.5z" fill="#009EE3" />
            </svg>
            Autorizar con Mercado Pago
          </>
        )}
      </button>

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
  initialPlan,
}: {
  businessId: string
  onDone: () => void
  initialPlan?: string
}) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [selected, setSelected] = useState(initialPlan ?? 'basic')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    // Verificar si ya tiene plan activo antes de mostrar el picker
    api
      .get<ApiResponse<{ status: string }>>(`/api/v1/businesses/${businessId}/subscription`)
      .then((r) => { if (r.data.status === 'ACTIVE') setIsActive(true) })
      .catch(() => {})
  }, [businessId])

  useEffect(() => {
    api
      .get<{ data: Plan[] }>('/api/v1/plans')
      .then((r) => {
        setPlans(r.data)
        // Solo auto-seleccionar 'professional' si no llegó un plan pre-elegido
        if (!initialPlan && r.data.some((p) => p.slug === 'professional')) setSelected('professional')
      })
      .catch(() => {})
      .finally(() => setPlansLoading(false))
  }, [initialPlan])

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

  if (isActive) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">¡Ya tenés un plan activo!</h2>
          <p className="mt-1 text-sm text-gray-500">Tu suscripción está funcionando. Podés ir al dashboard.</p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Ir al dashboard →
        </button>
      </div>
    )
  }

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
          {plans.filter((p) => p.isPublic).map((plan) => {
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
                {plan.slug === 'professional' && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                    Recomendado
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    <p className="mt-0.5 text-lg font-bold text-gray-900">
                      {fmtARS(plan.priceARS)}
                      {plan.priceARS !== null && <span className="ml-1 text-sm font-normal text-gray-500">/mes</span>}
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

function OnboardingContent() {
  const router = useRouter()
  const params = useSearchParams()
  const initialPlan = params.get('plan') ?? undefined
  const oauthResult = params.get('mp') // 'connected' | 'error' | null
  const oauthError = params.get('mp_error') // error code de MP
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
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-lg font-bold tracking-tight text-gray-900">Pay Alert</span>
        {step !== null && step > 1 && (
          <button
            onClick={() => {
              localStorage.setItem(ONBOARDING_DONE_KEY, '1')
              router.replace('/dashboard')
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Ir al dashboard →
          </button>
        )}
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
                  onSkip={() => handleStep2Done(false)}
                  oauthError={oauthResult === 'error' ? oauthError : null}
                />
              )}
              {step === 3 && businessId && (
                <Step3
                  businessId={businessId}
                  onDone={handleDone}
                  initialPlan={initialPlan}
                />
              )}
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              Paso {step} de {STEPS.length}
              {step > 1 && (
                <>
                  {' · '}
                  <button
                    onClick={() => {
                      localStorage.setItem(ONBOARDING_DONE_KEY, '1')
                      router.replace('/dashboard')
                    }}
                    className="underline hover:text-gray-600"
                  >
                    saltar configuración
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </main>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <OnboardingContent />
    </Suspense>
  )
}
