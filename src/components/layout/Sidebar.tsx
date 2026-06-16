'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearSession } from '@/lib/auth'
import { useActiveBusiness } from '@/lib/business-context'
import type { BusinessRole } from '@/types'

type NavItem = {
  href: string
  label: string
  roles: readonly BusinessRole[]
  exists: boolean
  icon: React.ReactNode
}

const ALL_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'OBSERVER'] as const satisfies readonly BusinessRole[]
const MANAGER_ROLES = ['OWNER', 'ADMIN'] as const satisfies readonly BusinessRole[]

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Dueño',
  ADMIN: 'Administrador',
  MEMBER: 'Empleado',
  OBSERVER: 'Observador',
}

const BUSINESS_NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    roles: ALL_ROLES,
    exists: true,
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/payments',
    label: 'Pagos',
    roles: ALL_ROLES,
    exists: true,
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/businesses',
    label: 'Mi Comercio',
    roles: MANAGER_ROLES,
    exists: true,
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/dashboard/members',
    label: 'Miembros',
    roles: MANAGER_ROLES,
    exists: true,
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const ACCOUNT_NAV: NavItem[] = [
  {
    href: '/dashboard/settings',
    label: 'Configuración',
    roles: ALL_ROLES,
    exists: true,
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

// ─── Business Switcher ────────────────────────────────────────────────────────

function BusinessSwitcher() {
  const { businessId, businessName, businesses, switchBusiness } = useActiveBusiness()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  if (!businessName) return null

  const canSwitch = businesses.length > 1

  return (
    <div ref={ref} className="relative border-b border-border px-3 py-2">
      <button
        onClick={() => canSwitch && setOpen((o) => !o)}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${canSwitch ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
          {businessName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{businessName}</p>
        </div>
        {canSwitch && (
          <svg
            className={`h-4 w-4 flex-shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {businesses.map((b) => {
            const active = b.id === businessId
            return (
              <button
                key={b.id}
                onClick={() => { switchBusiness(b.id); setOpen(false) }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${active ? 'bg-primary-light' : 'hover:bg-gray-50'}`}
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${active ? 'text-primary' : 'text-foreground'}`}>
                    {b.name}
                  </p>
                  <p className="text-xs text-muted">{ROLE_LABELS[b.role]}</p>
                </div>
                {active && (
                  <svg className="h-4 w-4 flex-shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function NavLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const active =
    pathname === item.href ||
    (item.href !== '/dashboard' && pathname.startsWith(item.href))
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
        ${active
          ? 'bg-primary-light text-primary'
          : 'text-muted hover:bg-gray-100 hover:text-foreground'
        }`}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { role } = useActiveBusiness()
  const pathname = usePathname()
  const router = useRouter()

  function visible(items: NavItem[]) {
    return items.filter(
      (item) => item.exists && (!role || (item.roles as readonly string[]).includes(role)),
    )
  }

  function handleLogout() {
    onClose()
    clearSession()
    router.push('/login')
  }

  return (
    <>
      {/* Overlay — solo mobile, cierra el drawer al tocar fuera */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-card
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:transition-none
        `}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <span className="text-base font-semibold text-foreground">Pay Alert</span>
        </div>

        <BusinessSwitcher />

        <nav className="flex flex-1 flex-col p-3">
          <div className="flex flex-col gap-1">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted/60">
              Negocio
            </p>
            {visible(BUSINESS_NAV).map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={onClose} />
            ))}
          </div>

          <div className="flex-1" />

          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted/60">
              Cuenta
            </p>
            {visible(ACCOUNT_NAV).map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={onClose} />
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-gray-100 hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </nav>
      </aside>
    </>
  )
}
