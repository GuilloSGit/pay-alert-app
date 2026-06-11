'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { api } from '@/lib/api'
import type { BusinessRole, BusinessMembership, ApiResponse } from '@/types'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<BusinessRole | null>(null)

  useEffect(() => {
    api
      .get<ApiResponse<BusinessMembership[]>>('/api/v1/businesses')
      .then((res) => {
        const first = res.data[0]
        if (first) setRole(first.role)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex h-full">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
