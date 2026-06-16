'use client'

import { createContext, useContext } from 'react'
import type { BusinessRole } from '@/types'

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'

export interface BusinessBrief {
  id: string
  name: string
  role: BusinessRole
}

interface BusinessContextValue {
  businessId: string | null
  businessName: string | null
  role: BusinessRole | null
  businesses: BusinessBrief[]
  switchBusiness: (id: string) => void
  subscriptionStatus: SubscriptionStatus | null
  trialEndsAt: string | null
  subscriptionWarning: string | null
  openSidebar: () => void
}

export const BusinessContext = createContext<BusinessContextValue>({
  businessId: null,
  businessName: null,
  role: null,
  businesses: [],
  switchBusiness: () => {},
  subscriptionStatus: null,
  trialEndsAt: null,
  subscriptionWarning: null,
  openSidebar: () => {},
})

export function useActiveBusiness() {
  return useContext(BusinessContext)
}
