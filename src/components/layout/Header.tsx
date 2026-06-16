'use client'

import { useSyncExternalStore } from 'react'
import { getUser } from '@/lib/auth'
import { useActiveBusiness } from '@/lib/business-context'
import type { User } from '@/types'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { openSidebar } = useActiveBusiness()

  const user = useSyncExternalStore<User | null>(
    (cb) => {
      window.addEventListener('storage', cb)
      return () => window.removeEventListener('storage', cb)
    },
    () => getUser(),
    () => null,
  )

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={openSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-gray-100 hover:text-foreground lg:hidden"
          aria-label="Abrir menú"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-foreground sm:block">{user.name}</span>
        </div>
      )}
    </header>
  )
}
