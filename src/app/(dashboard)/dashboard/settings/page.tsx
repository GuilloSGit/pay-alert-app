'use client'

import Link from 'next/link'
import { PageShell } from '@/components/layout/PageShell'
import { useActiveBusiness } from '@/lib/business-context'
import { BusinessesSection } from './_sections/BusinessesSection'
import { MpConnectSection } from './_sections/MpConnectSection'
import { SubscriptionSection } from './_sections/SubscriptionSection'
import { AlertasSection } from './_sections/AlertasSection'
import { CierresEmailSection } from './_sections/CierresEmailSection'
import { ProfileSection } from './_sections/ProfileSection'
import { SecuritySection } from './_sections/SecuritySection'
import { DevicesSection } from './_sections/DevicesSection'
import { QuietHoursSection } from './_sections/QuietHoursSection'

export default function SettingsPage() {
  const { role } = useActiveBusiness()
  const isAdmin = role === 'OWNER' || role === 'ADMIN'

  return (
    <PageShell title="Configuración" className="space-y-6">
      <div className="max-w-2xl space-y-6">
        <BusinessesSection />

        {isAdmin && (
          <>
            {/* Asistente de configuración */}
            <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary-light px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-primary-dark">Asistente de configuración</p>
                <p className="text-xs text-primary-dark/70">Conectá tu cuenta de MP y elegí tu plan paso a paso.</p>
              </div>
              <Link
                href="/onboarding"
                className="shrink-0 rounded-lg border border-primary bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Ir al asistente →
              </Link>
            </div>

            <MpConnectSection />
            <SubscriptionSection />
          </>
        )}

        <AlertasSection />
        {isAdmin && <CierresEmailSection />}
        <ProfileSection />
        <SecuritySection />

        {/* Notificaciones */}
        <div className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-base font-semibold text-foreground">Notificaciones</h2>
            <p className="text-xs text-muted">Push a dispositivos y horario silencioso.</p>
          </div>
          <DevicesSection />
          <QuietHoursSection />
        </div>
      </div>
    </PageShell>
  )
}
