'use client'

import { createContext, useContext } from 'react'
import type { BusinessRole } from '@/types'

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
}

export const BusinessContext = createContext<BusinessContextValue>({
  businessId: null,
  businessName: null,
  role: null,
  businesses: [],
  switchBusiness: () => {},
})

export function useActiveBusiness() {
  return useContext(BusinessContext)
}
