'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { api } from '@/lib/api'
import { BusinessContext } from '@/lib/business-context'
import type { BusinessRole, BusinessMembership, ApiResponse } from '@/types'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [role, setRole] = useState<BusinessRole | null>(null)

  useEffect(() => {
    api
      .get<ApiResponse<BusinessMembership[]>>('/api/v1/businesses')
      .then((res) => {
        const first = res.data[0]
        if (first) {
          setBusinessId(first.id)
          setBusinessName(first.name)
          setRole(first.role)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <BusinessContext.Provider value={{ businessId, businessName, role }}>
      <div className="flex h-full">
        <Sidebar role={role} />
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </BusinessContext.Provider>
  )
}
