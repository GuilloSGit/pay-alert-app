// Tipos e helpers compartidos entre las secciones de Settings.

// ─── Regla de notificación ────────────────────────────────────────────────────

export interface NotificationRule {
  id: string
  minAmount: number | null
  closureEmailFrequency: string | null
  closureEmailHour: number | null
}

// ─── Dispositivo ──────────────────────────────────────────────────────────────

export interface Device {
  id: string
  platform: 'android' | 'ios' | 'web'
  deviceName: string | null
  lastSeenAt: string | null
  createdAt: string
}

export const PLATFORM_LABELS: Record<Device['platform'], string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
}

// ─── Conexión MP ──────────────────────────────────────────────────────────────

export interface MpConnection {
  mpUserId: string
  isActive: boolean
  connectedAt: string
  lastVerifiedAt: string | null
}

// ─── Suscripción ──────────────────────────────────────────────────────────────

export interface SubscriptionDetail {
  id: string
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'
  trialEndsAt: string | null
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelledAt: string | null
  plan: {
    name: string
    slug: string
    priceARS: string
    trialDays: number
  }
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionDetail['status'], string> = {
  TRIALING: 'Período de prueba',
  ACTIVE: 'Activa',
  PAST_DUE: 'Pago pendiente',
  SUSPENDED: 'Suspendida',
  CANCELLED: 'Cancelada',
}

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionDetail['status'], string> = {
  TRIALING: 'bg-blue-50 text-blue-700 border-blue-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAST_DUE: 'bg-red-50 text-red-700 border-red-200',
  SUSPENDED: 'bg-orange-50 text-orange-700 border-orange-200',
  CANCELLED: 'bg-gray-50 text-gray-600 border-gray-200',
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const ms = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return 'Hace un momento'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Hace ${days}d`
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr))
}
