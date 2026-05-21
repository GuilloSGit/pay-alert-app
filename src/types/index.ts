export interface User {
  id: string
  email: string
  name: string
}

export interface Business {
  id: string
  name: string
  description?: string
  category?: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  businessId: string
  mpPaymentId: string
  amount: number
  currency: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED'
  description?: string
  payerEmail?: string
  payerName?: string
  paymentMethod?: string
  paidAt?: string
  receivedAt: string
}

export interface Plan {
  id: string
  name: string
  slug: 'basic' | 'business' | 'enterprise'
  priceARS: number
  maxMembers: number
  maxDevicesPerMember: number
  historyDays: number
  dailySummary: boolean
  alertByAmount: boolean
  dataExport: boolean
  outboundWebhooks: boolean
}

export interface Subscription {
  id: string
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'
  plan: Pick<Plan, 'name' | 'slug'>
  trialEndsAt?: string
  currentPeriodStart: string
  currentPeriodEnd: string
}

export interface BusinessMember {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'OBSERVER'
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED'
  joinedAt: string
  user: Pick<User, 'id' | 'email' | 'name'>
}

export interface ApiError {
  error: string
  code: string
}

export interface ApiResponse<T> {
  data: T
}
