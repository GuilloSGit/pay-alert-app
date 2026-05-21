import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Dashboard" />
      <main className="flex-1 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard label="Pagos hoy" value="—" description="próximamente" />
          <StatCard label="Total del mes" value="—" description="próximamente" />
          <StatCard label="Miembros activos" value="—" description="próximamente" />
          <StatCard label="Suscripción" value="—" description="próximamente" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimos pagos</CardTitle>
            <CardDescription>
              Acá vas a ver los cobros recientes de tus comercios conectados a Mercado Pago.
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-muted mb-4">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Sin pagos aún</p>
            <p className="mt-1 text-sm text-muted">
              Conectá tu comercio a Mercado Pago para empezar a recibir alertas.
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}

function StatCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted">{description}</p>
    </Card>
  )
}
