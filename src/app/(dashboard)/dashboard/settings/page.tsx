'use client'

import { PageShell } from '@/components/layout/PageShell'
import { BusinessesSection } from './_sections/BusinessesSection'
import { MpConnectSection } from './_sections/MpConnectSection'
import { SubscriptionSection } from './_sections/SubscriptionSection'
import { AlertasSection } from './_sections/AlertasSection'
import { CierresEmailSection } from './_sections/CierresEmailSection'
import { ProfileSection } from './_sections/ProfileSection'
import { SecuritySection } from './_sections/SecuritySection'
import { DevicesSection } from './_sections/DevicesSection'

export default function SettingsPage() {
  return (
    <PageShell title="Configuración" className="space-y-6">
      <div className="max-w-2xl space-y-6">
        <BusinessesSection />
        <MpConnectSection />
        <SubscriptionSection />
        <AlertasSection />
        <CierresEmailSection />
        <ProfileSection />
        <SecuritySection />
        <DevicesSection />
      </div>
    </PageShell>
  )
}
