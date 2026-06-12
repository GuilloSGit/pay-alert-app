'use client'

import { createContext, useContext } from 'react'
import type { BusinessRole } from '@/types'

interface BusinessContextValue {
  businessId: string | null
  businessName: string | null
  role: BusinessRole | null
}

export const BusinessContext = createContext<BusinessContextValue>({
  businessId: null,
  businessName: null,
  role: null,
})

export function useActiveBusiness() {
  return useContext(BusinessContext)
}
