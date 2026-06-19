'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { getUser } from '@/lib/auth'

interface Plan {
  slug: string
  name: string
  priceARS: string | null
  maxMembers: number
  maxBusinesses: number
  dailySummary: boolean
  alertByAmount: boolean
  dataExport: boolean
  closures: boolean
  outboundWebhooks: boolean
  isPublic: boolean
}

const PLAN_FEATURES: Record<string, { label: string; highlight?: boolean }[]> = {
  basic: [
    { label: 'Alertas en tiempo real (< 15 seg)' },
    { label: 'Historial 30 días' },
    { label: '1 comercio · hasta 3 miembros' },
    { label: 'Push en browser y dispositivos' },
  ],
  professional: [
    { label: 'Alertas en tiempo real (< 15 seg)' },
    { label: 'Historial 1 año completo', highlight: true },
    { label: '2 comercios · hasta 6 miembros', highlight: true },
    { label: 'Alertas por monto mínimo', highlight: true },
    { label: 'Exportación CSV', highlight: true },
    { label: 'Cierres diarios por email', highlight: true },
  ],
  enterprise: [
    { label: 'Todo lo del plan Profesional' },
    { label: 'Comercios y miembros ilimitados', highlight: true },
    { label: 'Webhooks salientes', highlight: true },
    { label: 'API keys de acceso', highlight: true },
    { label: 'Soporte prioritario', highlight: true },
    { label: 'Configuración a medida', highlight: true },
  ],
}

function fmtARS(amount: string | null) {
  if (amount === null) return 'A medida'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

function CheckIcon({ highlight }: { highlight?: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${highlight ? 'text-emerald-400' : 'text-slate-400'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function SuscribirsePage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ data: Plan[] }>('/api/v1/plans')
      .then((r) => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(slug: string) {
    setSelecting(slug)
    const user = getUser()
    if (user) {
      router.push(`/onboarding?plan=${slug}`)
    } else {
      router.push(`/register?plan=${slug}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#040c07] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a2 2 0 00-2 2v.5A5 5 0 007 10v3l-1 1v1h12v-1l-1-1v-3a5 5 0 00-3-4.5V5a2 2 0 00-2-2zm0 16a2 2 0 002-2h-4a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight">Pay Alert</span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-slate-400 transition-colors hover:text-white"
        >
          Ya tengo cuenta →
        </Link>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-4xl px-6 pb-6 pt-12 text-center sm:px-10 sm:pt-16">
        <span className="mb-4 inline-block rounded-full border border-emerald-800 bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-400">
          14 días de prueba gratuita · Sin tarjeta requerida
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Elegí tu plan
        </h1>
        <p className="mt-3 text-base text-slate-400">
          Empezá gratis. Suscribite cuando estés listo.
        </p>
      </div>

      {/* Plans */}
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-3">
            {plans.map((plan) => {
              const features = PLAN_FEATURES[plan.slug] ?? []
              const isRecommended = plan.slug === 'professional'
              const isSelecting = selecting === plan.slug
              const isEnterprise = !plan.isPublic

              return (
                <div
                  key={plan.slug}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                    isRecommended
                      ? 'border-emerald-600/60 bg-emerald-950/30 shadow-lg shadow-emerald-950/40'
                      : isEnterprise
                        ? 'border-violet-600/40 bg-violet-950/20'
                        : 'border-white/10 bg-white/5'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white shadow">
                        Más popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <p className={`text-sm font-semibold uppercase tracking-wide ${isEnterprise ? 'text-violet-300' : 'text-slate-300'}`}>
                      {plan.name}
                    </p>
                    <div className="mt-2 flex items-end gap-1">
                      <span className="text-3xl font-bold text-white">
                        {fmtARS(plan.priceARS)}
                      </span>
                      {plan.priceARS !== null && (
                        <span className="mb-1 text-sm text-slate-500">/mes</span>
                      )}
                    </div>
                    {plan.priceARS !== null ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {plan.maxBusinesses} comercio{plan.maxBusinesses !== 1 ? 's' : ''} · hasta {plan.maxMembers} miembro{plan.maxMembers !== 1 ? 's' : ''}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">
                        Comercios y miembros ilimitados
                      </p>
                    )}
                  </div>

                  <ul className="flex-1 space-y-2.5 mb-6">
                    {features.map((f) => (
                      <li key={f.label} className="flex items-center gap-2.5 text-sm">
                        <CheckIcon highlight={f.highlight} />
                        <span className={f.highlight ? 'text-slate-200' : 'text-slate-400'}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isEnterprise ? (
                    <a
                      href="mailto:guillermoandrada@gmail.com?subject=Consulta%20Enterprise%20Pay%20Alert"
                      className="w-full rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 bg-violet-700 text-white hover:bg-violet-600 shadow-md shadow-violet-900/40"
                    >
                      Hablemos →
                    </a>
                  ) : (
                    <button
                      onClick={() => handleSelect(plan.slug)}
                      disabled={selecting !== null}
                      className={`w-full rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                        isRecommended
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-900/40'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isSelecting ? (
                        <Spinner size="sm" className="border-white" />
                      ) : (
                        `Empezar con ${plan.name} →`
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Trial note */}
        <p className="mt-8 text-center text-xs text-slate-600">
          Los 14 días de prueba empiezan al crear tu comercio. Podés suscribirte al plan que prefieras antes, durante o después del trial.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-6 text-center">
        <p className="text-xs text-slate-600">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-slate-400 hover:text-white transition-colors underline underline-offset-2">
            Iniciá sesión
          </Link>
        </p>
      </footer>
    </div>
  )
}
