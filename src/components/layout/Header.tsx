'use client'

import { useSyncExternalStore } from 'react'
import { getUser } from '@/lib/auth'
import type { User } from '@/types'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const user = useSyncExternalStore<User | null>(
    (cb) => {
      window.addEventListener('storage', cb)
      return () => window.removeEventListener('storage', cb)
    },
    () => getUser(),
    () => null,
  )

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      {user && (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">{user.name}</span>
        </div>
      )}
    </header>
  )
}
