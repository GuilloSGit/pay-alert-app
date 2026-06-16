import Link from 'next/link'

export default function SuscripcionResultadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground">¡Gracias!</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Estamos procesando tu suscripción. En unos minutos tu cuenta estará activa y recibirás un email de confirmación.
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}
